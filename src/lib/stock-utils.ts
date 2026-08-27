import { prisma } from "./prisma";
import {
  getFinaProductById,
  getFinaStockAtStore,
} from "./fina";

export async function getProductStockAtStore(
  productId: string,
  storeSlug: string
): Promise<number> {
  const product = await getFinaProductById(productId);
  if (!product) return 0;
  return getFinaStockAtStore(product, storeSlug);
}

export async function validateCartStockAtStore(
  items: Array<{ productId: string; qty: number }>,
  storeSlug: string
): Promise<{ valid: boolean; productId?: string; available?: number }> {
  for (const item of items) {
    const stock = await getProductStockAtStore(item.productId, storeSlug);
    if (stock < item.qty) {
      return { valid: false, productId: item.productId, available: stock };
    }
  }

  return { valid: true };
}

export async function decrementOrderStock(
  _orderId: string,
  _deliverySlug: string
): Promise<void> {
  // FINA is the inventory source of truth. Stock is validated at checkout
  // but not written back from the storefront.
}
