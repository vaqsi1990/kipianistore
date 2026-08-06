import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { bogTokenManager } from '@/lib/bog-token';

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;

    // Verify order exists in database
    const dbOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!dbOrder) {
      console.error(`Order ${orderId} not found in database`);
      return NextResponse.json(
        { error: 'Order not found in database' },
        { status: 404 }
      );
    }

    const tokenInfo = bogTokenManager.getTokenInfo();
    console.log('Current token info:', tokenInfo);

    // Get a valid token
    const access_token = await bogTokenManager.getValidToken();
    if (!access_token) {
      console.error('Failed to obtain valid token');
      return NextResponse.json(
        { error: 'Failed to obtain valid token' },
        { status: 401 }
      );
    }

    // Call BOG API
    const response = await axios.get(
      `https://api.bog.ge/payments/v1/receipt/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Accept-Language': 'ka',
          'Content-Type': 'application/json',
        },
      }
    );

    const bogData = response.data;
    console.log(`BOG API response for order ${orderId}:`, bogData);

    // Define paid statuses
    const paidStatuses = ['completed', 'partial_completed', 'blocked'];
    const isPaid = paidStatuses.includes(bogData.order_status?.key);

    // Update database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid,
        paymentMethod: bogData.payment_detail?.transfer_method?.value || dbOrder.paymentMethod,
        totalPrice: parseFloat(bogData.purchase_units?.transfer_amount || dbOrder.totalPrice.toString()),
        paymentStatus: bogData.order_status?.key || 'unknown',
        paidAt: isPaid ? new Date() : dbOrder.paidAt,
      },
    });

    return NextResponse.json({
      success: true,
      paymentStatus: bogData.order_status?.key || 'unknown',
      statusDescription: bogData.order_status?.value || '',
      isPaid,
      order: {
        id: bogData.order_id,
        totalPrice: parseFloat(bogData.purchase_units?.transfer_amount || '0'),
        paymentMethod: bogData.payment_detail?.transfer_method?.value || dbOrder.paymentMethod,
        paymentStatus: bogData.order_status?.key || 'unknown',
        buyer: bogData.buyer,
        raw: bogData,
      },
      raw: bogData,
    });
  } catch (error: any) {
    const errorMessage = error?.response?.data || error.message;
    const errorStatus = error.response?.status || 500;
    console.error(`BOG order check error for ${params.orderId}:`, errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch BOG order status', details: errorMessage },
      { status: errorStatus }
    );
  }
}