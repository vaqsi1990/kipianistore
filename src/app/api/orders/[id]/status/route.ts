import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const orderId = params.id;
    const body = await request.json();
    const { isPaid, isDelivered } = body;

    // Validate the order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (typeof isPaid === 'boolean') {
      updateData.isPaid = isPaid;
      if (isPaid) {
        updateData.paidAt = new Date();
      } else {
        updateData.paidAt = null;
      }
    }

    if (typeof isDelivered === 'boolean') {
      updateData.isDelivered = isDelivered;
      if (isDelivered) {
        updateData.deliveredAt = new Date();
      } else {
        updateData.deliveredAt = null;
      }
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: true,
        orderitems: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' }, 
      { status: 500 }
    );
  }
} 