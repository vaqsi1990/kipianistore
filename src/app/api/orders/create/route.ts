import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';
import { sendOrderReceipt } from '@/lib/email';
import { sendOrderToAdmin } from '@/lib/email';
import { getCartForUser, validateDeliveryForCart } from '@/lib/cart-helpers';
import { CartItem } from '@/lib/types';
import { decrementOrderStock } from '@/lib/stock-utils';
import { buildFinaOrderItems } from '@/lib/fina-cart';
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      shippingAddress, 
      paymentMethod, 
      deliveryOption,
      cartId 
    } = body;

    // Get the user's cart
    const cart = await getCartForUser(session.user.id);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const cartItems = cart.items as CartItem[];
    const deliveryCheck = await validateDeliveryForCart(cartItems, deliveryOption);
    if (!deliveryCheck.valid) {
      return NextResponse.json(
        {
          error: deliveryCheck.stockError
            ? 'Insufficient stock at the selected store'
            : deliveryCheck.availableSlugs.length === 0
              ? 'Cart items are not available at a common pickup location'
              : 'Invalid delivery location for this cart',
        },
        { status: 400 }
      );
    }

    let orderItems;
    try {
      orderItems = await buildFinaOrderItems(cartItems);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid FINA product in cart' },
        { status: 400 }
      );
    }

    const itemsPrice = parseFloat(
      orderItems
        .reduce((sum, item) => sum + item.price * item.qty, 0)
        .toFixed(2)
    );
    const shippingPrice = 0;
    const taxPrice = 0;

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        itemsPrice: new Prisma.Decimal(itemsPrice),
        shippingPrice: new Prisma.Decimal(shippingPrice),
        taxPrice: new Prisma.Decimal(taxPrice),
        totalPrice: new Prisma.Decimal(itemsPrice),
        deliveryLocation: deliveryOption,
        orderitems: {
          create: orderItems
        }
      },
      include: {
        orderitems: true,
        user: true
      }
    });

    if (deliveryOption) {
      await decrementOrderStock(order.id, deliveryOption);
    }

    // Send order receipt email
    try {
      const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`;
      await sendOrderReceipt(shippingAddress.email, order, customerName);
    } catch (emailError) {
      console.error('Error sending order receipt email:', emailError);
      // Don't fail the order if email fails
    }

    // Send order info to admin
    try {
      await sendOrderToAdmin(order);
    } catch (adminEmailError) {
      console.error('Error sending order info to admin:', adminEmailError);
      // Don't fail the order if email fails
    }

    // Clear the cart after successful order creation
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: [],
        itemsPrice: 0,
        totalPrice: 0,
        shippingPrice: 0,
        taxPrice: 0
      }
    });

    return NextResponse.json({ 
      success: true, 
      order: order,
      message: 'Order created successfully and cart cleared'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' }, 
      { status: 500 }
    );
  }
} 