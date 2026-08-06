// app/api/create-order/route.ts
// FIXED: Changed item.quantity to item.qty to match the actual cart item structure
// The cart items use 'qty' field, not 'quantity' field
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '../../../../auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sendOrderReceipt } from '@/lib/email';
import { sendOrderToAdmin } from '@/lib/email';
import { bogTokenManager } from '@/lib/bog-token';

export async function POST(req: NextRequest) {
  
  try {
    const { token, orderData } = await req.json();


    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    if (!orderData) {
      return NextResponse.json({ error: 'Missing order data' }, { status: 400 });
    }

    const { cart, totalAmount, orderId } = orderData;
    
    // Calculate total amount from cart items
    const items = cart?.items || [];
    
    // Validate that cart has items
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // Validate and transform cart items for BOG API
    const basket = items.map((item: any) => {
      // Ensure quantity is a positive integer
      const quantity = parseInt(item.qty);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for product ${item.productId}: ${item.qty}`);
      }
      
      // Ensure unit price is a valid number and convert to number (BOG expects number, not string)
      const unitPrice = parseFloat(item.price);
      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw new Error(`Invalid price for product ${item.productId}: ${item.price}`);
      }
      
      // Ensure product ID exists and is a string
      const productId = item.productId || item.id;
      if (!productId || typeof productId !== 'string') {
        throw new Error(`Missing or invalid product ID for item: ${JSON.stringify(item)}`);
      }
      
      return {
        quantity: quantity, // BOG expects integer
        unit_price: unitPrice, // BOG expects number
        product_id: productId, // BOG expects string
      };
    });



    // Validate total amount
    const totalAmountNumber = parseFloat(totalAmount);
    if (isNaN(totalAmountNumber) || totalAmountNumber <= 0) {
      throw new Error(`Invalid total amount: ${totalAmount}`);
    }
    
    // Calculate total from basket to ensure consistency
    const calculatedTotal = basket.reduce((sum: number, item: { quantity: number; unit_price: number }) => sum + (item.quantity * item.unit_price), 0);
    
    // Warn if totals don't match (but don't fail the request)
    if (Math.abs(calculatedTotal - totalAmountNumber) > 0.01) {
      console.warn(`Total amount mismatch: calculated=${calculatedTotal}, provided=${totalAmountNumber}`);
    }

    // Prepare the request data for BOG
    const bogRequestData = {
      callback_url: 'https://www.kipianistore.ge/api/payment-callback',
      external_order_id: orderId,
      purchase_units: {
        currency: 'GEL',
        total_amount: totalAmountNumber,
        basket: basket,
      },
      redirect_urls: {
        success: `https://www.kipianistore.ge/en/order-confirmation?status=success&orderId=${orderId}`,
        fail: `https://www.kipianistore.ge/en/payment-fail?orderId=${orderId}`,
      },
    };
    
    // Use token manager for automatic token refresh and retry
    const response = await bogTokenManager.makeAuthenticatedRequest(async (validToken) => {
      console.log('🔑 Using BOG token for API call');
      return axios.post(
        'https://api.bog.ge/payments/v1/ecommerce/orders',
        bogRequestData,
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Accept-Language': 'ka',
            'Content-Type': 'application/json',
          },
        }
      );
    });
    
    console.log('=== BOG API RESPONSE RECEIVED ===');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Extract data from BOG response - handle both possible response formats
    const { links, _links, id, order_id } = response.data;
    
    console.log('Extracted response data:', { links, _links, id, order_id });
    
    // BOG API returns either 'links' or '_links', and the redirect URL is in 'redirect' link
    const allLinks = links || _links || {};
    const redirectUrl = allLinks.redirect?.href || allLinks.approve?.href;
    
    // If no redirect URL found, try to construct it from the order ID
    let finalRedirectUrl = redirectUrl;
    if (!finalRedirectUrl && (id || order_id)) {
      const orderId = id || order_id;
      finalRedirectUrl = `https://www.kipianistore.ge?order_id=${orderId}`;
    }

    if (!finalRedirectUrl) {
      throw new Error('Redirect URL not found in BOG response and could not be constructed');
    }

    // Create the order in the database after successful BOG order creation
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Get the user's cart - prioritize user ID over session cart ID
      let cart = await prisma.cart.findFirst({
        where: { userId: session.user.id }
      });
      
      // If no user cart found, try session cart ID
      if (!cart) {
        cart = await prisma.cart.findFirst({
          where: { sessionCartId: session.user.id }
        });
      }

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart not found or empty');
      }
      
      // Ensure the cart is properly linked to the user
      if (cart.userId !== session.user.id) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { userId: session.user.id }
        });
        cart.userId = session.user.id;
      }

      // Create order items from cart items
      const orderItems = cart.items.map((item: any) => ({
        productId: item.productId,
        qty: item.qty,
        price: parseFloat(item.price),
        title: item.name,
        image: item.image
      }));

      // Calculate delivery price (all locations are free for now)
      const shippingPrice = 0;

      // Create the order in database
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          shippingAddress: orderData.address,
          paymentMethod: 'BOG Card Payment',
          itemsPrice: cart.itemsPrice,
          shippingPrice: new Prisma.Decimal(shippingPrice),
          taxPrice: cart.taxPrice,
          totalPrice: new Prisma.Decimal(totalAmountNumber),
          deliveryLocation: orderData.deliveryOption,
          orderitems: {
            create: orderItems
          }
        },
        include: {
          orderitems: true,
          user: true
        }
      });



      // Send order receipt email to customer
      try {
        const customerName = `${orderData.address.firstName} ${orderData.address.lastName}`;
        await sendOrderReceipt(orderData.address.email, order, customerName);
      } catch (emailError) {
        // Don't fail the order if email fails
      }

      // Send order info to admin
      try {
        await sendOrderToAdmin(order);
      } catch (adminEmailError) {
        // Don't fail the order if email fails
      }

      // Clear the cart after successful order creation
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          itemsPrice: new Prisma.Decimal(0),
          totalPrice: new Prisma.Decimal(0),
          shippingPrice: new Prisma.Decimal(0),
          taxPrice: new Prisma.Decimal(0),
        }
      });



    } catch (orderError) {
      // This is a critical error - the order must be created for BOG payments
      // Return an error response instead of proceeding
      return NextResponse.json({ 
        error: 'Failed to create order in database',
        details: 'Order creation failed but BOG payment was initiated. Please contact support.',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      redirectUrl: finalRedirectUrl,
      orderId,
      bogOrderId: id || order_id
    });
  } catch (error: any) {
    // Return detailed error information to frontend
    let errorMessage = 'Order creation failed';
    let errorDetails = {};
    
    if (error?.response?.data) {
      // BOG API error
      errorMessage = error.response.data.message || error.response.data.error || 'BOG API error';
      errorDetails = error.response.data;
    } else if (error?.message) {
      // Custom validation error
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
