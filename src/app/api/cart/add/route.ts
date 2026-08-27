import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';
import { CartItem } from '@/lib/types';
import { Prisma } from "@/generated/prisma/client";
import { getFinaProductById } from '@/lib/fina';
import { assertFinaStock, finaProductToCartItem } from '@/lib/fina-cart';

function calculateCartTotals(items: CartItem[]) {
  const itemsPrice = items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.qty);
  }, 0);

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

    const qty = quantity ?? 1;
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    let sessionCartId = cookieStore.get('sessionCartId')?.value;
    
    if (!sessionCartId) {
      sessionCartId = crypto.randomUUID();
    }

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const product = await getFinaProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const selectedStore = cookieStore.get('selectedStore')?.value;
    try {
      assertFinaStock(product, qty, selectedStore);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Out of stock' },
        { status: 400 }
      );
    }

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

    const existingItems = cart.items as CartItem[];
    const cartSize = size || "N/A";
    const existingItemIndex = existingItems.findIndex(
      item => item.productId === productId && item.size === cartSize
    );

    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      updatedItems = [...existingItems];
      const nextQty = updatedItems[existingItemIndex].qty + qty;
      try {
        assertFinaStock(product, nextQty, selectedStore);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Out of stock' },
          { status: 400 }
        );
      }
      updatedItems[existingItemIndex] = {
        ...finaProductToCartItem(product, cartSize, nextQty),
      };
    } else {
      updatedItems = [...existingItems, finaProductToCartItem(product, cartSize, qty)];
    }

    const { itemsPrice, totalPrice, shippingPrice, taxPrice } = calculateCartTotals(updatedItems);

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

    if (!cookieStore.get('sessionCartId')) {
      response.cookies.set('sessionCartId', sessionCartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
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
