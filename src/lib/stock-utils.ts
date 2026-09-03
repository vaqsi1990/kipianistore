import { prisma } from "./prisma";
import {
  getFinaProductById,
  getFinaStockAtStore,
  invalidateFinaCatalogCache,
  saveFinaProductOut,
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
  orderId: string,
  deliverySlug: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderitems: true },
  });
  if (!order?.orderitems.length) return;

  try {
    const finaDocId = await saveFinaProductOut({
      orderId: order.id,
      storeSlug: deliverySlug,
      purpose: `Website order ${order.id}`,
      comment: order.id,
      items: order.orderitems.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        price: Number(item.price),
      })),
    });

    const current =
      order.paymentResult && typeof order.paymentResult === "object"
        ? (order.paymentResult as Record<string, unknown>)
        : {};

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentResult: {
          ...current,
          finaDocId,
          finaPostedAt: new Date().toISOString(),
        },
      },
    });
    invalidateFinaCatalogCache();
  } catch (error) {
    console.error("FINA product-out failed:", error);
    const current =
      order.paymentResult && typeof order.paymentResult === "object"
        ? (order.paymentResult as Record<string, unknown>)
        : {};
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentResult: {
          ...current,
          finaError: error instanceof Error ? error.message : String(error),
        },
      },
    });
  }
}
