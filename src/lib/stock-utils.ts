import { prisma } from "./prisma";
import { legacyFlagsFromSlugs } from "./store-utils";

export async function getProductStockAtStore(
  productId: string,
  storeSlug: string
): Promise<number> {
  const row = await prisma.productStore.findFirst({
    where: {
      productId,
      store: { slug: storeSlug, isActive: true },
    },
    select: { stock: true },
  });

  return row?.stock ?? 0;
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
  const store = await prisma.store.findFirst({
    where: { slug: deliverySlug, isActive: true },
    select: { id: true },
  });

  if (!store) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { orderitems: true },
  });

  if (!order?.orderitems.length) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.orderitems) {
      const row = await tx.productStore.findUnique({
        where: {
          productId_storeId: {
            productId: item.productId,
            storeId: store.id,
          },
        },
      });

      if (!row) continue;

      const nextStock = Math.max(0, row.stock - item.qty);
      await tx.productStore.update({
        where: {
          productId_storeId: {
            productId: item.productId,
            storeId: store.id,
          },
        },
        data: { stock: nextStock },
      });
    }

    const productIds = Array.from(
      new Set(order.orderitems.map((item) => item.productId))
    );

    for (const productId of productIds) {
      const rows = await tx.productStore.findMany({
        where: { productId },
        include: { store: { select: { slug: true } } },
      });

      const inStockSlugs = rows
        .filter((row) => row.stock > 0)
        .map((row) => row.store.slug);

      await tx.product.update({
        where: { id: productId },
        data: legacyFlagsFromSlugs(inStockSlugs),
      });
    }
  });
}
