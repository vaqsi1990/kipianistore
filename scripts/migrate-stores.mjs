import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

const DEFAULT_STORES = [
  {
    slug: "tbilisi",
    nameKa: "თბილისი",
    nameEn: "Tbilisi",
    address: "თ. ერისთავის 1",
    city: "Tbilisi",
    sortOrder: 1,
  },
  {
    slug: "batumi",
    nameKa: "ბათუმი",
    nameEn: "Batumi",
    address: "ა. პუშკინის 115/117",
    city: "Batumi",
    sortOrder: 2,
  },
  {
    slug: "batumi44",
    nameKa: "ბათუმი (44)",
    nameEn: "Batumi (Pushkin 44)",
    address: "ა. პუშკინის 44",
    city: "Batumi",
    sortOrder: 3,
  },
  {
    slug: "qutaisi",
    nameKa: "ქუთაისი",
    nameEn: "Kutaisi",
    address: "ზ. ფურცელაძის 15",
    city: "Kutaisi",
    sortOrder: 4,
  },
  {
    slug: "kobuleti",
    nameKa: "ქობულეთი",
    nameEn: "Kobuleti",
    address: "შ. რუსთaveli 151",
    city: "Kobuleti",
    sortOrder: 5,
  },
];

const SLUG_TO_BOOLEAN = {
  tbilisi: "tbilisi",
  batumi: "batumi",
  batumi44: "batumi44",
  qutaisi: "qutaisi",
  kobuleti: "kobuleti",
};

function slugsFromLegacyFlags(product) {
  return Object.keys(SLUG_TO_BOOLEAN).filter(
    (slug) => product[SLUG_TO_BOOLEAN[slug]]
  );
}

function legacyFlagsFromSlugs(slugs) {
  const flags = {
    tbilisi: false,
    batumi: false,
    batumi44: false,
    qutaisi: false,
    kobuleti: false,
  };
  for (const slug of slugs) {
    const key = SLUG_TO_BOOLEAN[slug];
    if (key) flags[key] = true;
  }
  return flags;
}

async function syncProductStores(productId, entries) {
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

async function main() {
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
      .filter(Boolean);

    if (storeIds.length) {
      await syncProductStores(
        product.id,
        storeIds.map((storeId) => ({ storeId, stock: 1 }))
      );
    }
  }

  console.log(`Seeded ${stores.length} stores, migrated ${products.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
