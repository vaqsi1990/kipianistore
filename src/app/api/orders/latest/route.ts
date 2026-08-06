import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the latest order for the current user
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        orderitems: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      order: {
        ...order,
        itemsPrice: parseFloat(order.itemsPrice.toString()),
        shippingPrice: parseFloat(order.shippingPrice.toString()),
        taxPrice: parseFloat(order.taxPrice.toString()),
        totalPrice: parseFloat(order.totalPrice.toString()),
      }
    });

  } catch (error) {
    console.error('Error fetching latest order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' }, 
      { status: 500 }
    );
  }
} 