import { cookies } from "next/headers";
import { auth } from "../../../auth";
import { prisma } from "../prisma";
import { convertToPlainObject } from "../utils";
import { CartItem } from "../types";
import { Prisma } from "@/generated/prisma/client";
import { getCartForUser, enrichCartItem } from "../cart-helpers";
import { getFinaProductById } from "../fina";
import { assertFinaStock, finaProductToCartItem } from "../fina-cart";

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

    // Get cart items with location information
    const cartItems = cart.items as CartItem[];
    
    const itemsWithLocations = await Promise.all(
      cartItems.map((item) => enrichCartItem(item))
    );
  
    // Convert decimals and return
    const plainCart = convertToPlainObject({
      ...cart,
      items: itemsWithLocations,
      itemsPrice: cart.itemsPrice.toString(),
      totalPrice: cart.totalPrice.toString(),
      shippingPrice: cart.shippingPrice.toString(),
      taxPrice: cart.taxPrice.toString(),
    });
    
    return plainCart;
  }

export async function addToCart(productId: string, size: string, quantity: number = 1) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const product = await getFinaProductById(productId);
    if (!product) throw new Error('Product not found');

    const selectedStore = (await cookies()).get('selectedStore')?.value;
    assertFinaStock(product, quantity, selectedStore);

    const cartSize = size || "N/A";

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

    const existingItems = cart.items as CartItem[];
    const existingItemIndex = existingItems.findIndex(
      item => item.productId === productId && item.size === cartSize
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

    return convertToPlainObject({
      ...updatedCart,
      items: updatedItems,
      itemsPrice: updatedCart.itemsPrice.toString(),
      totalPrice: updatedCart.totalPrice.toString(),
      shippingPrice: updatedCart.shippingPrice.toString(),
      taxPrice: updatedCart.taxPrice.toString(),
    });
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
      item => !(item.productId === productId && item.size === size)
    );

    // Ensure remaining items have location information
    const updatedItems = await Promise.all(
      filteredItems.map((item) => enrichCartItem(item))
    );

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

    return convertToPlainObject({
      ...updatedCart,
      items: updatedItems,
      itemsPrice: updatedCart.itemsPrice.toString(),
      totalPrice: updatedCart.totalPrice.toString(),
      shippingPrice: updatedCart.shippingPrice.toString(),
      taxPrice: updatedCart.taxPrice.toString(),
    });
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

    const existingItems = cart.items as CartItem[];
    const updatedItems = await Promise.all(
      existingItems.map(async (item) => {
        if (item.productId === productId && item.size === size) {
          return enrichCartItem({ ...item, qty: quantity });
        }
        return enrichCartItem(item);
      })
    );

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

    return convertToPlainObject({
      ...updatedCart,
      items: updatedItems,
      itemsPrice: updatedCart.itemsPrice.toString(),
      totalPrice: updatedCart.totalPrice.toString(),
      shippingPrice: updatedCart.shippingPrice.toString(),
      taxPrice: updatedCart.taxPrice.toString(),
    });
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

    return convertToPlainObject({
      ...updatedCart,
      items: [],
      itemsPrice: updatedCart.itemsPrice.toString(),
      totalPrice: updatedCart.totalPrice.toString(),
      shippingPrice: updatedCart.shippingPrice.toString(),
      taxPrice: updatedCart.taxPrice.toString(),
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

function calculateCartTotals(items: CartItem[]) {
  const itemsPrice = items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.qty);
  }, 0);

  // Shipping calculation based on total items and price
  let shippingPrice = 0;
  if (itemsPrice > 0) {
    if (itemsPrice >= 500) {
      shippingPrice = 0; // Free shipping for orders over ₾500
    } else if (itemsPrice >= 200) {
      shippingPrice = 0; // ₾15 shipping for orders ₾200-₾499
    } else {
      shippingPrice = 0; // ₾25 shipping for orders under ₾200
    }
  }

  // Tax calculation (18% VAT rate for Georgia)
  const taxPrice = itemsPrice * 0.18;

  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return {
    itemsPrice: parseFloat(itemsPrice.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    shippingPrice: parseFloat(shippingPrice.toFixed(2)),
    taxPrice: parseFloat(taxPrice.toFixed(2)),
  };
}
  