import { cookies } from "next/headers";
import { auth } from "../../../auth";
import { prisma } from "../prisma";
import { convertToPlainObject } from "../utils";
import { CartItem } from "../types";
import { Prisma } from "@/generated/prisma/client";
import { getCartForUser } from "../cart-helpers";
import { getFinaProductById } from "../fina";
import {
  assertFinaStock,
  calculateFinaCartTotals,
  finaProductToCartItem,
  isSameCartLine,
  normalizeCartSize,
  refreshCartItemsFromFina,
} from "../fina-cart";

function serializeCart(cart: {
  itemsPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  shippingPrice: Prisma.Decimal;
  taxPrice: Prisma.Decimal;
}, items: CartItem[]) {
  return convertToPlainObject({
    ...cart,
    items,
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}

export async function getMyCart() {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    if (!sessionCartId && !userId) {
      return undefined;
    }

    let cart;
    if (userId) {
      cart = await getCartForUser(userId);
    } else if (sessionCartId) {
      cart = await prisma.cart.findFirst({
        where: { sessionCartId },
      });
    }

    if (!cart) return undefined;

    const cartItems = cart.items as CartItem[];
    const itemsWithLocations = await refreshCartItemsFromFina(cartItems);
    const totals = calculateFinaCartTotals(itemsWithLocations);

    const changed =
      JSON.stringify(cartItems) !== JSON.stringify(itemsWithLocations) ||
      Number(cart.itemsPrice) !== totals.itemsPrice;

    if (changed) {
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: itemsWithLocations,
          itemsPrice: new Prisma.Decimal(totals.itemsPrice),
          totalPrice: new Prisma.Decimal(totals.totalPrice),
          shippingPrice: new Prisma.Decimal(totals.shippingPrice),
          taxPrice: new Prisma.Decimal(totals.taxPrice),
        },
      });
    }

    return serializeCart(cart, itemsWithLocations);
  }

export async function addToCart(productId: string, size: string, quantity: number = 1) {
  try {
    const cookieStore = await cookies();
    let sessionCartId = cookieStore.get('sessionCartId')?.value;
    if (!sessionCartId) {
      sessionCartId = crypto.randomUUID();
      cookieStore.set('sessionCartId', sessionCartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const product = await getFinaProductById(productId);
    if (!product) throw new Error('Product not found');

    const selectedStore = cookieStore.get('selectedStore')?.value;
    assertFinaStock(product, quantity, selectedStore);

    const cartSize = normalizeCartSize(size);

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
    const existingItemIndex = existingItems.findIndex(
      item => isSameCartLine(item, { productId, size: cartSize })
    );

    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      updatedItems = [...existingItems];
      const nextQty = updatedItems[existingItemIndex].qty + quantity;
      assertFinaStock(product, nextQty, selectedStore);
      updatedItems[existingItemIndex] = finaProductToCartItem(product, cartSize, nextQty);
    } else {
      updatedItems = [...existingItems, finaProductToCartItem(product, cartSize, quantity)];
    }

    const { itemsPrice, totalPrice, shippingPrice, taxPrice } = calculateFinaCartTotals(updatedItems);

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

    return serializeCart(updatedCart, updatedItems);
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export async function removeFromCart(productId: string, size: string) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const cart = await prisma.cart.findFirst({
      where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
    });

    if (!cart) throw new Error('Cart not found');

    const existingItems = cart.items as CartItem[];
    const filteredItems = existingItems.filter(
      item => !isSameCartLine(item, { productId, size })
    );

    const updatedItems = await refreshCartItemsFromFina(filteredItems);
    const { itemsPrice, totalPrice, shippingPrice, taxPrice } = calculateFinaCartTotals(updatedItems);

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

    return serializeCart(updatedCart, updatedItems);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

export async function updateCartItemQuantity(productId: string, size: string, quantity: number) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const cart = await prisma.cart.findFirst({
      where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
    });

    if (!cart) throw new Error('Cart not found');

    const selectedStore = (await cookies()).get('selectedStore')?.value;
    const product = await getFinaProductById(productId);
    if (!product) throw new Error('Product not found');
    assertFinaStock(product, quantity, selectedStore);

    const existingItems = cart.items as CartItem[];
    const updatedItems = await refreshCartItemsFromFina(
      existingItems.map((item) => {
        if (isSameCartLine(item, { productId, size })) {
          return { ...item, qty: quantity };
        }
        return item;
      })
    );

    const { itemsPrice, totalPrice, shippingPrice, taxPrice } = calculateFinaCartTotals(updatedItems);

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

    return serializeCart(updatedCart, updatedItems);
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
}

export async function clearCart() {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const cart = await prisma.cart.findFirst({
      where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
    });

    if (!cart) throw new Error('Cart not found');

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: [],
        itemsPrice: new Prisma.Decimal(0),
        totalPrice: new Prisma.Decimal(0),
        shippingPrice: new Prisma.Decimal(0),
        taxPrice: new Prisma.Decimal(0),
      },
    });

    return serializeCart(updatedCart, []);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}
