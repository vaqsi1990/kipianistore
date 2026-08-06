import nodemailer from 'nodemailer';
import { resolveDeliveryLocationLabel } from '@/lib/cart-helpers';

// Create a transporter using SMTP with improved configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Add these settings to improve deliverability
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  rateLimit: 3,
  // Add DKIM and SPF support
  dkim: {
    domainName: process.env.DOMAIN_NAME || 'yourdomain.com',
    keySelector: 'default',
    privateKey: process.env.DKIM_PRIVATE_KEY || '',
    headerFieldNames: 'to:from:subject:date',
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  // Use dynamic URL that works on both development and Vercel
  let baseUrl = process.env.NEXTAUTH_URL;
  
  if (!baseUrl) {
    // On Vercel, VERCEL_URL is provided without protocol
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Fallback for local development
      baseUrl = 'http://localhost:3000';
    }
  }
  
  const verificationUrl = `${baseUrl}/en/verify-email?token=${token}`;

  const mailOptions = {
    from: {
      name: 'Furniture Store',
      address: process.env.EMAIL_USER || 'noreply@yourdomain.com'
    },
    to: email,
    subject: 'Verify your email address',
    // Add headers to prevent replies and improve deliverability
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'X-Mailer': 'Furniture Store Email System',
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'Feedback-ID': 'verification:furniturestore',
    },
    // Add message ID for better tracking
    messageId: `<verification-${Date.now()}@${process.env.DOMAIN_NAME || 'furniturestore.com'}>`,
    // Set reply-to to prevent replies
    replyTo: 'noreply@furniturestore.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Furniture Store!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        
        <p>This link will expire in 1 hour.</p>
        
        <p>If you didn't create an account, you can safely ignore this email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Furniture Store. Please do not reply to this email.
          <br>If you need assistance, please contact our support team through our website.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  // Use dynamic URL that works on both development and Vercel
  let baseUrl = process.env.NEXTAUTH_URL;
  
  if (!baseUrl) {
    // On Vercel, VERCEL_URL is provided without protocol
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      // Fallback for local development
      baseUrl = 'http://localhost:3000';
    }
  }
  
  const resetUrl = `${baseUrl}/ka/reset-password?token=${token}`;

  const mailOptions = {
    from: {
      name: 'Furniture Store',
      address: process.env.EMAIL_USER || 'noreply@yourdomain.com'
    },
    to: email,
    subject: 'Reset your password',
    // Add headers to prevent replies and improve deliverability
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'X-Mailer': 'Furniture Store Email System',
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'Feedback-ID': 'password-reset:furniturestore',
    },
    // Add message ID for better tracking
    messageId: `<password-reset-${Date.now()}@${process.env.DOMAIN_NAME || 'furniturestore.com'}>`,
    // Set reply-to to prevent replies
    replyTo: 'noreply@furniturestore.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p>This link will expire in 1 hour.</p>
        
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from Furniture Store. Please do not reply to this email.
          <br>If you need assistance, please contact our support team through our website.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
};

const getDeliveryLocationText = async (deliveryLocation: string) => {
  return resolveDeliveryLocationLabel(deliveryLocation, 'en');
};

export const sendOrderReceipt = async (email: string, order: any, customerName: string) => {
  const formatPrice = (price: number) => `₾${price.toFixed(2)}`;
  const deliveryLocationText = await getDeliveryLocationText(order.deliveryLocation);
  
  const orderItemsHtml = order.orderitems.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">
          <div>
            <div style="font-weight: 600; color: #333;">${item.title}</div>
            <div style="font-size: 14px; color: #666;">Qty: ${item.qty}</div>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
        ${formatPrice(item.price * item.qty)}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: {
      name: 'Furniture Store',
      address: process.env.EMAIL_USER || 'noreply@yourdomain.com'
    },
    to: email,
    subject: `Order Confirmation #${order.id}`,
    // Add headers to prevent replies and improve deliverability
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'X-Mailer': 'Furniture Store Email System',
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      'Feedback-ID': 'order-receipt:furniturestore',
    },
    // Add message ID for better tracking
    messageId: `<order-${order.id}-${Date.now()}@${process.env.DOMAIN_NAME || 'furniturestore.com'}>`,
    // Set reply-to to prevent replies
    replyTo: 'noreply@furniturestore.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #438c71; margin: 0; font-size: 28px;">Furniture Store</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Order Confirmation</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 10px 0;">Thank you for your order!</h2>
            <p style="color: #666; margin: 0;">Dear ${customerName},</p>
            <p style="color: #666; margin: 10px 0 0 0;">We've received your order and it's being processed. Here are your order details:</p>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #333;">Order Number:</span>
              <span style="color: #666;">#${order.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #333;">Order Date:</span>
              <span style="color: #666;">${new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600; color: #333;">Payment Method:</span>
              <span style="color: #666;">${order.paymentMethod}</span>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #438c71;">
                  <th style="padding: 12px; text-align: left; color: #333;">Item</th>
                  <th style="padding: 12px; text-align: right; color: #333;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">Subtotal:</span>
              <span style="font-weight: 600;">${formatPrice(parseFloat(order.itemsPrice.toString()))}</span>
            </div>
           
            
            <div style="display: flex; justify-content: space-between; border-top: 2px solid #438c71; padding-top: 8px; margin-top: 8px;">
              <span style="font-weight: 700; color: #333; font-size: 18px;">Total:</span>
              <span style="font-weight: 700; color: #438c71; font-size: 18px;">${formatPrice(parseFloat(order.totalPrice.toString()))}</span>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Delivery Information</h3>
            <p style="color: #666; margin: 0; line-height: 1.6;">
              ${deliveryLocationText}
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Shipping Address</h3>
            <p style="color: #666; margin: 0; line-height: 1.6;">
              ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
              ${order.shippingAddress.streetAddress}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
              ${order.shippingAddress.country}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; margin: 0;">If you have any questions about your order, please contact us through our website.</p>
            <p style="color: #666; margin: 10px 0 0 0;">Thank you for choosing Furniture Store!</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from Furniture Store. Please do not reply to this email.
            <br>For support, please visit our website or contact our customer service team.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending order receipt:', error);
    return { success: false, error: 'Failed to send order receipt' };
  }
}; 

export const sendContactEmail = async (contactData: {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) => {
  const mailOptions = {
    from: {
      name: `${contactData.email} via Furniture Store`,
      address: process.env.EMAIL_USER || 'noreply@yourdomain.com'
    },
    to: 'kipianistore@gmail.com', // The email where contact form submissions will be sent
    subject: `Contact Form: ${contactData.subject} - From: ${contactData.fullName}`,
    // Add headers for better deliverability but allow replies
    headers: {
      'X-Mailer': 'Furniture Store Contact System',
      'Feedback-ID': 'contact-form:furniturestore',
    },
    // Add message ID for better tracking
    messageId: `<contact-${Date.now()}@${process.env.DOMAIN_NAME || 'furniturestore.com'}>`,
    // Set reply-to to the customer's email so you can reply directly
    replyTo: contactData.email,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #438c71; margin: 0; font-size: 28px;">Furniture Store</h1>
            <p style="color: #666; margin: 10px 0 0 0;">New Contact Form Submission</p>
            <div style="background-color: #438c71; color: white; padding: 10px; border-radius: 6px; margin-top: 15px;">
              <p style="margin: 0; font-weight: 600;">📧 Message from: ${contactData.fullName}</p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Contact Information</h2>
            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Name:</strong>
              <span style="color: #666; margin-left: 10px;">${contactData.fullName}</span>
            </div>
            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Email:</strong>
              <span style="color: #666; margin-left: 10px;">${contactData.email}</span>
            </div>
            ${contactData.phone ? `
            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Phone:</strong>
              <span style="color: #666; margin-left: 10px;">${contactData.phone}</span>
            </div>
            ` : ''}
            <div style="margin-bottom: 15px;">
              <strong style="color: #333;">Subject:</strong>
              <span style="color: #666; margin-left: 10px;">${contactData.subject}</span>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Message</h3>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; border-left: 4px solid #438c71;">
              <p style="color: #333; margin: 0; line-height: 1.6; white-space: pre-wrap;">${contactData.message}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; margin: 0;">This message was sent from the contact form on your website.</p>
            <p style="color: #666; margin: 10px 0 0 0; font-weight: 600; color: #438c71;">💬 You can reply directly to this email to respond to the customer!</p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Customer Email: ${contactData.email}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from Furniture Store Contact Form.
            <br>Submitted on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error: 'Failed to send contact email' };
  }
}; 

export const sendOrderToAdmin = async (order: any) => {
  const formatPrice = (price: number) => `₾${price.toFixed(2)}`;
  const orderItemsHtml = order.orderitems.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">
          <div>
            <div style="font-weight: 600; color: #333;">${item.title}</div>
            <div style="font-size: 14px; color: #666;">Qty: ${item.qty}</div>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
        ${formatPrice(item.price * item.qty)}
      </td>
    </tr>
  `).join('');

  const shipping = order.shippingAddress;
  const user = order.user;
  const deliveryLocationText = await resolveDeliveryLocationLabel(
    order.deliveryLocation,
    'ka'
  );

  const mailOptions = {
    from: {
      name: 'Furniture Store',
      address: process.env.EMAIL_USER || 'noreply@yourdomain.com'
    },
    to: 'kipianistore@gmail.com',
    subject: `New Order Received #${order.id}`,
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      'X-Mailer': 'Furniture Store Admin System',
      'Feedback-ID': 'order-admin:furniturestore',
    },
    messageId: `<order-admin-${order.id}-${Date.now()}@${process.env.DOMAIN_NAME || 'furniturestore.com'}>`,
    replyTo: 'noreply@furniturestore.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #438c71;">New Order Received</h1>
          <h2 style="color: #333;">Order #${order.id}</h2>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <h3>Customer Information</h3>
          <ul style="color: #333;">
            <li><strong>სახელი და გვარი:</strong> ${shipping.firstName} ${shipping.lastName}</li>
            <li><strong>ემეილი:</strong> ${shipping.email}</li>
            <li><strong>ტელეფონი:</strong> ${shipping.phone || 'N/A'}</li>
         
            <li><strong>მყიდველის ემეილი:</strong> ${user?.email || 'N/A'}</li>
          </ul>
          <h3>მყიდველის მისამართი</h3>
          <p style="color: #333;">
            ${shipping.streetAddress}<br>
            ${shipping.city}, ${shipping.postalCode}<br>
            ${shipping.country}
          </p>
          <h3>ნაყიდი ნივთები</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #438c71;">
                <th style="padding: 12px; text-align: left; color: #333;">Item</th>
                <th style="padding: 12px; text-align: right; color: #333;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsHtml}
            </tbody>
          </table>
          <h3>ჯამი</h3>
          <ul style="color: #333;">
            <li><strong>Subtotal:</strong> ${formatPrice(parseFloat(order.itemsPrice.toString()))}</li>
            <li><strong>Shipping:</strong> ${formatPrice(parseFloat(order.shippingPrice.toString()))}</li>
            <li><strong>Tax:</strong> ${formatPrice(parseFloat(order.taxPrice.toString()))}</li>
            <li><strong>Total:</strong> ${formatPrice(parseFloat(order.totalPrice.toString()))}</li>
            <li><strong>Payment Method:</strong> ${order.paymentMethod}</li>
            <li><strong>Delivery Option:</strong> ${deliveryLocationText}</li>
          </ul>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending admin order email:', error);
    return { success: false, error: 'Failed to send admin order email' };
  }
}; 
