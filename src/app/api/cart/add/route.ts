import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';
import { CartItem } from '@/lib/types';
import { Prisma } from '@prisma/client';

function calculateCartTotals(items: CartItem[]) {
  const itemsPrice = items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.qty);
  }, 0);

  // No shipping or tax calculation - just return the items price
  return {
    itemsPrice: parseFloat(itemsPrice.toFixed(2)),
    totalPrice: parseFloat(itemsPrice.toFixed(2)),
    shippingPrice: 0,
    taxPrice: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { productId, size, quantity } = await request.json();

    if (!productId || !size) {
      return NextResponse.json(
        { error: 'Product ID and size are required' },
        { status: 400 }
      );
    }

    // Get or create session cart ID
    const cookieStore = await cookies();
    let sessionCartId = cookieStore.get('sessionCartId')?.value;
    
    if (!sessionCartId) {
      sessionCartId = crypto.randomUUID();
    }

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get product details
    const product = await prisma.product.findFirst({
      where: { id: productId },
      include: { sizes: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Handle OTHERS products (they don't have sizes, only a single price)
    let finalPrice: number;
    if (product.category === "OTHERS") {
      if (!product.price) {
        return NextResponse.json(
          { error: 'Product price not available' },
          { status: 400 }
        );
      }
      const basePrice = parseFloat(product.price.toString());
      finalPrice = product.sales && product.sales > 0 
        ? basePrice * (1 - product.sales / 100)
        : basePrice;
    } else {
      // Handle regular products with sizes
      const productSize = product.sizes.find(s => s.size === size);
      if (!productSize) {
        return NextResponse.json(
          { error: 'Product size not found' },
          { status: 404 }
        );
      }
      const basePrice = parseFloat(productSize.price.toString());
      finalPrice = product.sales && product.sales > 0 
        ? basePrice * (1 - product.sales / 100)
        : basePrice;
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          sessionCartId,
          userId,
          items: [],
          itemsPrice: new Prisma.Decimal(0),
          totalPrice: new Prisma.Decimal(0),
          shippingPrice: new Prisma.Decimal(0),
          taxPrice: new Prisma.Decimal(0),
        },
      });
    }

    // Check if item already exists in cart
    const existingItems = cart.items as CartItem[];
    const existingItemIndex = existingItems.findIndex(
      item => item.productId === productId && item.size === size
    );

    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      updatedItems = [...existingItems];
      updatedItems[existingItemIndex].qty += quantity || 1;
    } else {
      // Add new item
      const newItem: CartItem = {
        productId,
        name: product.title,
        size: product.category === "OTHERS" ? "N/A" : size, // Use "N/A" for OTHERS products
        qty: quantity || 1,
        image: product.images[0],
        price: finalPrice.toFixed(2),
      };
      updatedItems = [...existingItems, newItem];
    }

    // Calculate totals
    const { itemsPrice, totalPrice, shippingPrice, taxPrice } = calculateCartTotals(updatedItems);

    // Update cart
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: updatedItems,
        itemsPrice: new Prisma.Decimal(itemsPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
        shippingPrice: new Prisma.Decimal(shippingPrice),
        taxPrice: new Prisma.Decimal(taxPrice),
      },
    });

    // Create response with cookie if needed
    const response = NextResponse.json({
      success: true,
      cart: {
        ...updatedCart,
        items: updatedItems,
        itemsPrice: updatedCart.itemsPrice.toString(),
        totalPrice: updatedCart.totalPrice.toString(),
        shippingPrice: updatedCart.shippingPrice.toString(),
        taxPrice: updatedCart.taxPrice.toString(),
      }
    });

    // Set cookie if it didn't exist
    if (!cookieStore.get('sessionCartId')) {
      response.cookies.set('sessionCartId', sessionCartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'პროდუქტის კალათაში დამატება ვერ მოხერხდა' },
      { status: 500 }
    );
  }
} 