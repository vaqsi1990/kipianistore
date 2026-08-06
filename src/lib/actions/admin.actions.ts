import { auth } from "../../../auth";
import { prisma } from "../prisma";
import { bogTokenManager } from "../bog-token";

export async function refreshAllBOGOrderStatuses() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'admin') {
      throw new Error('Unauthorized or not admin');
    }

    // Get all BOG orders
    const bogOrders = await prisma.order.findMany({
      where: {
        paymentMethod: { contains: 'BOG' }
      },
      select: {
        id: true,
        bogOrderId: true,
        paymentMethod: true,
        isPaid: true,
        isDelivered: true,
        paidAt: true
      }
    });

    if (bogOrders.length === 0) {
      return { success: true, message: 'No BOG orders found' };
    }

    // Refresh each order status
    let successCount = 0;
    let errorCount = 0;

    for (const order of bogOrders) {
      try {
        const access_token = await bogTokenManager.getValidToken();

        const bogApiOrderId = order.bogOrderId || order.id;
        const bogResponse = await fetch(
          `https://api.bog.ge/payments/v1/receipt/${bogApiOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Accept-Language": "ka",
              "Content-Type": "application/json",
            },
          }
        );

        if (bogResponse.ok) {
          const bogData = await bogResponse.json();
          
          // Update order status based on BOG response
          let isPaid = false;
          let isDelivered = false;
          let paidAt = null;
          let paymentResult = null;

          if (bogData.order_status?.key === 'completed' || bogData.order_status?.key === 'blocked' || bogData.order_status?.key === 'partial_completed') {
            isPaid = true;
            paidAt = new Date();
            isDelivered = false;
            paymentResult = {
              id: bogData.payment_detail?.transaction_id,
              status: 'succeeded',
              update_time: new Date().toISOString(),
              email_address: bogData.buyer?.email,
              payer_id: bogData.payment_detail?.payer_identifier,
              payment_method: bogData.payment_detail?.transfer_method?.key || 'card',
              card_type: bogData.payment_detail?.card_type,
              card_expiry: bogData.payment_detail?.card_expiry_date
            };
          } else if (bogData.order_status?.key === 'rejected') {
            isPaid = false;
            isDelivered = false;
            paymentResult = {
              status: 'failed',
              reason: bogData.reject_reason || 'unknown',
              update_time: new Date().toISOString()
            };
          } else if (bogData.order_status?.key === 'processing') {
            isPaid = false;
            isDelivered = false;
            paymentResult = {
              status: 'processing',
              update_time: new Date().toISOString()
            };
          }

          // Update the order in database
          await prisma.order.update({
            where: { id: order.id },
            data: {
              isPaid,
              isDelivered,
              paidAt,
              ...(paymentResult && { paymentResult })
            }
          });

          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to fetch BOG status for order ${order.id}:`, bogResponse.status);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error refreshing order ${order.id}:`, error);
      }
    }



    return {
      success: true,
      message: `Refreshed ${successCount} orders successfully, ${errorCount} errors`,
      successCount,
      errorCount
    };

  } catch (error) {
    console.error('Error in refreshAllBOGOrderStatuses:', error);
    return {
      success: false,
      error: 'Failed to refresh BOG order statuses'
    };
  }
}
