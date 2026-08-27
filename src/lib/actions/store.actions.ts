"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAdmin } from "../auth-helpers";
import { getFinaStoreList } from "../fina";
import {
  DEFAULT_STORES,
  legacyFlagsFromSlugs,
  slugsFromLegacyFlags,
} from "../store-utils";

function formatStoreError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Operation failed";
}

const storeSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or dashes"),
  nameKa: z.string().min(1),
  nameEn: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function getActiveStores() {
  return getFinaStoreList().map((store, index) => ({
    id: store.slug,
    slug: store.slug,
    nameKa: store.nameKa,
    nameEn: store.nameEn,
    address: store.address,
    city: store.city,
    sortOrder: index,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function getAllStoresAdmin() {
  await requireAdmin();
  return prisma.store.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameKa: "asc" }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
}

export async function createStore(data: z.infer<typeof storeSchema>) {
  try {
    await requireAdmin();
    const store = storeSchema.parse(data);

    await prisma.store.create({
      data: {
        slug: store.slug,
        nameKa: store.nameKa,
        nameEn: store.nameEn,
        address: store.address,
        city: store.city,
        sortOrder: store.sortOrder ?? 0,
        isActive: store.isActive ?? true,
      },
    });

    revalidatePath("/adminall/stores");
    return { success: true, message: "Store created" };
  } catch (error) {
    return { success: false, message: formatStoreError(error) };
  }
}

export async function updateStore(
  id: string,
  data: Partial<z.infer<typeof storeSchema>>
) {
  try {
    await requireAdmin();

    await prisma.store.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.nameKa !== undefined && { nameKa: data.nameKa }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/adminall/stores");
    return { success: true, message: "Store updated" };
  } catch (error) {
    return { success: false, message: formatStoreError(error) };
  }
}

export async function deleteStore(id: string) {
  try {
    await requireAdmin();
    await prisma.store.delete({ where: { id } });
    revalidatePath("/adminall/stores");
    return { success: true, message: "Store deleted" };
  } catch (error) {
    return { success: false, message: formatStoreError(error) };
  }
}

export async function syncProductStores(
  productId: string,
  entries: Array<{ storeId: string; stock: number }>
) {
  const storeIds = entries.map((entry) => entry.storeId);
  const stockByStoreId = Object.fromEntries(
    entries.map((entry) => [entry.storeId, entry.stock])
  );

  await prisma.productStore.deleteMany({
    where: {
      productId,
      ...(storeIds.length ? { storeId: { notIn: storeIds } } : {}),
    },
  });

  if (!storeIds.length) {
    await prisma.product.update({
      where: { id: productId },
      data: legacyFlagsFromSlugs([]),
    });
    return;
  }

  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds }, isActive: true },
    select: { id: true, slug: true },
  });

  for (const store of stores) {
    await prisma.productStore.upsert({
      where: {
        productId_storeId: {
          productId,
          storeId: store.id,
        },
      },
      create: {
        productId,
        storeId: store.id,
        stock: stockByStoreId[store.id] ?? 1,
      },
      update: {
        stock: stockByStoreId[store.id] ?? 1,
      },
    });
  }

  const inStockSlugs = stores
    .filter((store) => (stockByStoreId[store.id] ?? 1) > 0)
    .map((store) => store.slug);

  await prisma.product.update({
    where: { id: productId },
    data: legacyFlagsFromSlugs(inStockSlugs),
  });
}

export async function seedDefaultStores() {
  for (const store of DEFAULT_STORES) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: {
        nameKa: store.nameKa,
        nameEn: store.nameEn,
        address: store.address,
        city: store.city,
        sortOrder: store.sortOrder,
        isActive: true,
      },
      create: store,
    });
  }
}

export async function migrateProductsToStores() {
  await seedDefaultStores();

  const stores = await prisma.store.findMany();
  const storeBySlug = Object.fromEntries(stores.map((s) => [s.slug, s.id]));

  const products = await prisma.product.findMany({
    select: {
      id: true,
      tbilisi: true,
      batumi: true,
      batumi44: true,
      qutaisi: true,
      kobuleti: true,
    },
  });

  for (const product of products) {
    const slugs = slugsFromLegacyFlags(product);
    const storeIds = slugs
      .map((slug) => storeBySlug[slug])
      .filter(Boolean) as string[];

    if (storeIds.length) {
      await syncProductStores(
        product.id,
        storeIds.map((storeId) => ({ storeId, stock: 1 }))
      );
    }
  }

  return { migrated: products.length };
}
