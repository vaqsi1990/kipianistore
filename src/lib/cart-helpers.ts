import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Cart } from "@prisma/client";
import { CartItem } from "./types";
import {
  getProductStoreSlugs,
  legacyFlagsFromSlugs,
  getAvailableStoreSlugsFromCart,
  getStoreLabel,
  DEFAULT_STORES,
} from "./store-utils";
import { validateCartStockAtStore } from "./stock-utils";

export async function getCartForUser(userId: string): Promise<Cart | null> {
  const cookieStore = await cookies();
  const sessionCartId = cookieStore.get("sessionCartId")?.value;

  let cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart && sessionCartId) {
    cart = await prisma.cart.findFirst({
      where: { sessionCartId },
    });

    if (cart) {
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { userId },
      });
    }
  }

  return cart;
}

export async function enrichCartItem(item: CartItem): Promise<CartItem> {
  const product = await prisma.product.findFirst({
    where: { id: item.productId },
    include: {
      stores: {
        include: {
          store: { select: { slug: true } },
        },
      },
    },
  });

  if (!product) return item;

  const storeSlugs = getProductStoreSlugs(product);
  const flags = legacyFlagsFromSlugs(storeSlugs);

  return {
    ...item,
    storeSlugs,
    ...flags,
  };
}

export async function enrichCartItems(items: CartItem[]): Promise<CartItem[]> {
  return Promise.all(items.map((item) => enrichCartItem(item)));
}

export async function validateDeliveryForCart(
  items: CartItem[],
  deliverySlug: string
): Promise<{ valid: boolean; availableSlugs: string[]; stockError?: boolean }> {
  const enrichedItems = await enrichCartItems(items);
  const availableSlugs = getAvailableStoreSlugsFromCart(enrichedItems);

  if (!availableSlugs.includes(deliverySlug)) {
    return { valid: false, availableSlugs };
  }

  const store = await prisma.store.findFirst({
    where: { slug: deliverySlug, isActive: true },
  });

  if (!store) {
    return { valid: false, availableSlugs };
  }

  const stockCheck = await validateCartStockAtStore(
    enrichedItems.map((item) => ({ productId: item.productId, qty: item.qty })),
    deliverySlug
  );

  if (!stockCheck.valid) {
    return { valid: false, availableSlugs, stockError: true };
  }

  return { valid: true, availableSlugs };
}

export async function resolveDeliveryLocationLabel(
  slug: string,
  locale: "ka" | "en" = "ka"
): Promise<string> {
  const store = await prisma.store.findFirst({
    where: { slug, isActive: true },
  });

  if (store) {
    return `${getStoreLabel(store, locale)} (${store.address})`;
  }

  const fallback = DEFAULT_STORES.find((entry) => entry.slug === slug);
  if (fallback) {
    return `${getStoreLabel(fallback, locale)} (${fallback.address})`;
  }

  return slug;
}
