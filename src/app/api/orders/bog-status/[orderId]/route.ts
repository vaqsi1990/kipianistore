import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { bogTokenManager } from "@/lib/bog-token";
import {
  isBogPaymentSuccessful,
  mapBogStatusToPaymentStatus,
} from "@/lib/bog-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.orderId;
    const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });

    if (!dbOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = dbOrder.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!dbOrder.paymentMethod?.includes("BOG")) {
      return NextResponse.json({
        success: true,
        isPaid: dbOrder.isPaid,
        paymentStatus: dbOrder.paymentStatus,
      });
    }

    const bogApiOrderId = dbOrder.bogOrderId || orderId;
    const access_token = await bogTokenManager.getValidToken();

    const response = await axios.get(
      `https://api.bog.ge/payments/v1/receipt/${bogApiOrderId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Accept-Language": "ka",
          "Content-Type": "application/json",
        },
      }
    );

    const bogData = response.data;
    const statusKey = bogData.order_status?.key as string | undefined;
    const isPaid = isBogPaymentSuccessful(statusKey);
    const paymentStatus = mapBogStatusToPaymentStatus(statusKey);

    if (isAdmin || isOwner) {
      const transferAmount = parseFloat(
        bogData.purchase_units?.transfer_amount || "0"
      );

      if (!dbOrder.isPaid && isPaid) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
            paidAt: new Date(),
            bogOrderId: bogData.order_id
              ? String(bogData.order_id)
              : dbOrder.bogOrderId,
            paymentStatus,
            paymentResult: {
              bogOrderId: bogData.order_id,
              status: statusKey,
              transferAmount,
              verifiedAt: new Date().toISOString(),
            },
          },
        });

        await prisma.cart.updateMany({
          where: { userId: dbOrder.userId },
          data: {
            items: [],
            itemsPrice: new Prisma.Decimal(0),
            totalPrice: new Prisma.Decimal(0),
            shippingPrice: new Prisma.Decimal(0),
            taxPrice: new Prisma.Decimal(0),
          },
        });
      } else if (dbOrder.isPaid !== isPaid || dbOrder.paymentStatus !== paymentStatus) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid,
            paymentStatus,
            paidAt: isPaid ? dbOrder.paidAt || new Date() : dbOrder.paidAt,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: statusKey || "unknown",
      statusDescription: bogData.order_status?.value || "",
      isPaid,
    });
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    return NextResponse.json(
      { error: "Failed to fetch BOG order status" },
      { status: err.response?.status || 500 }
    );
  }
}
