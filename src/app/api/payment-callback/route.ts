import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  isBogPaymentSuccessful,
  mapBogStatusToPaymentStatus,
} from "@/lib/bog-utils";
import { sendOrderReceipt, sendOrderToAdmin } from "@/lib/email";
import { decrementOrderStock } from "@/lib/stock-utils";

const PUBLIC_KEY = (
  process.env.BOG_PUBLIC_KEY ||
  `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----
`
).trim();

interface BogCallbackBody {
  order_id?: string;
  external_order_id?: string;
  order_status?: { key?: string; value?: string };
  purchase_units?: {
    transfer_amount?: string;
    request_amount?: string;
  };
  payment_detail?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const signature =
    req.headers.get("callback-signature") ||
    req.headers.get("Callback-Signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(rawBody);
    verify.end();

    const isValid = verify.verify(PUBLIC_KEY, signature, "base64");

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const data = JSON.parse(rawBody);
    const { event, body } = data as {
      event?: string;
      body?: BogCallbackBody;
    };

    if (event !== "order_payment" || !body) {
      return new NextResponse("OK", { status: 200 });
    }

    const bogOrderId = body.order_id;
    const externalOrderId = body.external_order_id;
    const statusKey = body.order_status?.key;
    const transferAmount = parseFloat(
      body.purchase_units?.transfer_amount ||
        body.purchase_units?.request_amount ||
        "0"
    );

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(externalOrderId
            ? [{ id: externalOrderId }, { externalOrderId }]
            : []),
          ...(bogOrderId ? [{ bogOrderId: String(bogOrderId) }] : []),
        ],
      },
      include: {
        orderitems: true,
        user: true,
      },
    });

    if (!order) {
      console.error("BOG callback: order not found", {
        externalOrderId,
        bogOrderId,
      });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isPaid = isBogPaymentSuccessful(statusKey);
    const paymentStatus = mapBogStatusToPaymentStatus(statusKey);

    if (isPaid && transferAmount > 0) {
      const orderTotal = Number(order.totalPrice);
      if (Math.abs(orderTotal - transferAmount) > 0.01) {
        console.error("BOG callback: amount mismatch", {
          orderTotal,
          transferAmount,
          orderId: order.id,
        });
        return NextResponse.json(
          { error: "Payment amount mismatch" },
          { status: 400 }
        );
      }
    }

    if (order.isPaid && isPaid) {
      return new NextResponse("OK", { status: 200 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : order.paidAt,
        bogOrderId: bogOrderId ? String(bogOrderId) : order.bogOrderId,
        paymentStatus,
        paymentResult: JSON.parse(
          JSON.stringify({
            bogOrderId,
            status: statusKey,
            statusDescription: body.order_status?.value,
            transferAmount,
            paymentDetail: body.payment_detail,
            processedAt: new Date().toISOString(),
          })
        ),
      },
      include: {
        orderitems: true,
        user: true,
      },
    });

    if (isPaid) {
      if (order.deliveryLocation) {
        await decrementOrderStock(order.id, order.deliveryLocation);
      }

      await prisma.cart.updateMany({
        where: { userId: order.userId },
        data: {
          items: [],
          itemsPrice: new Prisma.Decimal(0),
          totalPrice: new Prisma.Decimal(0),
          shippingPrice: new Prisma.Decimal(0),
          taxPrice: new Prisma.Decimal(0),
        },
      });

      try {
        const shippingAddress = order.shippingAddress as {
          email?: string;
          firstName?: string;
          lastName?: string;
        };
        const customerEmail =
          shippingAddress?.email || updatedOrder.user?.email;
        const customerName = `${shippingAddress?.firstName || ""} ${shippingAddress?.lastName || ""}`.trim();

        if (customerEmail) {
          await sendOrderReceipt(customerEmail, updatedOrder, customerName);
        }
        await sendOrderToAdmin(updatedOrder);
      } catch (emailError) {
        console.error("BOG callback: email failed", emailError);
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Payment callback error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
