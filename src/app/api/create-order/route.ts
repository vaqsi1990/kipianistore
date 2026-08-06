import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { bogTokenManager } from "@/lib/bog-token";
import { CartItem } from "@/lib/types";
import { getCartForUser } from "@/lib/cart-helpers";
import {
  extractBogOrderId,
  extractBogRedirectUrl,
} from "@/lib/bog-utils";

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.kipianistore.ge"
  );
}

async function getServerPrice(
  productId: string,
  size: string
): Promise<{ price: number; title: string } | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId },
    include: { sizes: true },
  });

  if (!product) return null;

  let price: number;
  if (product.category === "OTHERS") {
    if (!product.price) return null;
    price = Number(product.price);
  } else {
    const sizeRecord = product.sizes.find((s) => s.size === size);
    if (!sizeRecord) return null;
    price = Number(sizeRecord.price);
  }

  if (product.sales && product.sales > 0) {
    price = price * (1 - product.sales / 100);
  }

  return {
    price: parseFloat(price.toFixed(2)),
    title: product.title,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderData } = await req.json();

    if (!orderData?.address || !orderData?.deliveryOption) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const locale = orderData.locale === "en" ? "en" : "ka";
    const baseUrl = getBaseUrl();
    const address = orderData.address;

    const cart = await getCartForUser(session.user.id);

    if (!cart || !cart.items || (cart.items as CartItem[]).length === 0) {
      return NextResponse.json(
        { error: "Cart not found or empty" },
        { status: 400 }
      );
    }

    const cartItems = cart.items as CartItem[];
    const basket: {
      quantity: number;
      unit_price: number;
      product_id: string;
      description: string;
    }[] = [];
    const orderItems: {
      productId: string;
      qty: number;
      price: number;
      title: string;
      image: string;
    }[] = [];

    for (const item of cartItems) {
      const qty = parseInt(String(item.qty), 10);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }

      const productData = await getServerPrice(item.productId, item.size);
      if (!productData || productData.price <= 0) {
        return NextResponse.json(
          { error: `Invalid product or price: ${item.productId}` },
          { status: 400 }
        );
      }

      basket.push({
        quantity: qty,
        unit_price: productData.price,
        product_id: item.productId,
        description: item.name || productData.title,
      });

      orderItems.push({
        productId: item.productId,
        qty,
        price: productData.price,
        title: item.name || productData.title,
        image: item.image,
      });
    }

    const calculatedTotal = parseFloat(
      basket
        .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
        .toFixed(2)
    );

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        shippingAddress: address,
        paymentMethod: "BOG Card Payment",
        itemsPrice: new Prisma.Decimal(calculatedTotal),
        shippingPrice: new Prisma.Decimal(0),
        taxPrice: new Prisma.Decimal(0),
        totalPrice: new Prisma.Decimal(calculatedTotal),
        deliveryLocation: orderData.deliveryOption,
        isPaid: false,
        paymentStatus: "CREATED",
        externalOrderId: "",
        orderitems: {
          create: orderItems,
        },
      },
      include: {
        orderitems: true,
        user: true,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { externalOrderId: order.id },
    });

    const bogRequestData = {
      callback_url: `${baseUrl}/api/payment-callback`,
      external_order_id: order.id,
      capture: "automatic",
      buyer: {
        full_name: `${address.firstName} ${address.lastName}`.trim(),
        email: address.email,
        phone_number: address.phone,
      },
      purchase_units: {
        currency: "GEL",
        total_amount: calculatedTotal,
        basket,
      },
      redirect_urls: {
        success: `${baseUrl}/${locale}/order-confirmation?status=success&orderId=${order.id}`,
        fail: `${baseUrl}/${locale}/payment-fail?orderId=${order.id}`,
      },
    };

    const response = await bogTokenManager.makeAuthenticatedRequest(
      async (validToken) => {
        return axios.post(
          "https://api.bog.ge/payments/v1/ecommerce/orders",
          bogRequestData,
          {
            headers: {
              Authorization: `Bearer ${validToken}`,
              "Accept-Language": locale,
              "Content-Type": "application/json",
            },
          }
        );
      }
    );

    const responseData = response.data as Record<string, unknown>;
    const redirectUrl = extractBogRedirectUrl(responseData);
    const bogOrderId = extractBogOrderId(responseData);

    if (!redirectUrl) {
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json(
        { error: "Redirect URL not found in BOG response" },
        { status: 502 }
      );
    }

    if (bogOrderId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { bogOrderId },
      });
    }

    return NextResponse.json({
      success: true,
      redirectUrl,
      orderId: order.id,
      bogOrderId,
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { message?: string; error?: string; detail?: string } };
      message?: string;
    };

    let errorMessage = "Order creation failed";

    if (err?.response?.data) {
      errorMessage =
        err.response.data.message ||
        err.response.data.detail ||
        err.response.data.error ||
        "BOG API error";
    } else if (err?.message) {
      errorMessage = err.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
