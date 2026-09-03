export const DEFAULT_STORES = [
  {
    slug: "tbilisi",
    nameKa: "თბილისი",
    nameEn: "Tbilisi",
    address: "ბერბუკის 3",
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
    address: "ი. ჭავჭავაძის 51",
    city: "Kutaisi",
    sortOrder: 4,
  },
  {
    slug: "kobuleti",
    nameKa: "ქობულეთი",
    nameEn: "Kobuleti",
    address: "შ. რუსთაველი 151",
    city: "Kobuleti",
    sortOrder: 5,
  },
  {
    slug: "zugdidi",
    nameKa: "ზუგდიდი",
    nameEn: "Zugdidi",
    address: "დადიანის 5",
    city: "Zugdidi",
    sortOrder: 6,
  },
] as const;

const SLUG_TO_BOOLEAN: Record<string, keyof LegacyStoreFlags> = {
  tbilisi: "tbilisi",
  batumi: "batumi",
  batumi44: "batumi44",
  qutaisi: "qutaisi",
  kobuleti: "kobuleti",
  zugdidi: "zugdidi",
};

export type LegacyStoreFlags = {
  tbilisi: boolean;
  batumi: boolean;
  batumi44: boolean;
  qutaisi: boolean;
  kobuleti: boolean;
  zugdidi: boolean;
};

export type StoreInfo = {
  id: string;
  slug: string;
  nameKa: string;
  nameEn: string;
  address: string;
  city: string;
};

export function emptyLegacyFlags(): LegacyStoreFlags {
  return {
    tbilisi: false,
    batumi: false,
    batumi44: false,
    qutaisi: false,
    kobuleti: false,
    zugdidi: false,
  };
}

export function legacyFlagsFromSlugs(slugs: string[]): LegacyStoreFlags {
  const flags = emptyLegacyFlags();
  for (const slug of slugs) {
    const key = SLUG_TO_BOOLEAN[slug];
    if (key) flags[key] = true;
  }
  return flags;
}

export function slugsFromLegacyFlags(flags: Partial<LegacyStoreFlags>): string[] {
  return (Object.keys(SLUG_TO_BOOLEAN) as string[]).filter(
    (slug) => flags[SLUG_TO_BOOLEAN[slug] as keyof LegacyStoreFlags]
  );
}

export type ProductStoreEntry = {
  storeId: string;
  stock: number;
  store?: StoreInfo & { id: string };
};

export function getProductStoreSlugs(product: {
  stores?: { store: { slug: string }; stock?: number }[];
  tbilisi?: boolean;
  batumi?: boolean;
  batumi44?: boolean;
  qutaisi?: boolean;
  kobuleti?: boolean;
}): string[] {
  if (product.stores?.length) {
    return product.stores
      .filter((entry) => (entry.stock ?? 1) > 0)
      .map((entry) => entry.store.slug);
  }
  return slugsFromLegacyFlags(product);
}

export function getProductStoreAvailability(
  product: {
    stores?: {
      store: StoreInfo & { id?: string };
      stock?: number;
      storeId?: string;
    }[];
  } & Partial<LegacyStoreFlags>
): Array<StoreInfo & { stock: number; inStock: boolean }> {
  if (product.stores?.length) {
    return product.stores.map((entry) => ({
      id: entry.store.id ?? entry.storeId ?? "",
      slug: entry.store.slug,
      nameKa: entry.store.nameKa,
      nameEn: entry.store.nameEn,
      address: entry.store.address,
      city: entry.store.city,
      stock: entry.stock ?? 0,
      inStock: (entry.stock ?? 0) > 0,
    }));
  }

  return DEFAULT_STORES.filter((store) => {
    const key = SLUG_TO_BOOLEAN[store.slug];
    return key ? Boolean(product[key]) : false;
  }).map((store) => ({
    ...store,
    id: store.slug,
    stock: 1,
    inStock: true,
  }));
}

export function hasStockAtStore(
  product: {
    stores?: { store: { slug: string }; stock?: number }[];
  } & Partial<LegacyStoreFlags>,
  storeSlug: string
): boolean {
  if (product.stores?.length) {
    const entry = product.stores.find((row) => row.store.slug === storeSlug);
    return Boolean(entry && (entry.stock ?? 0) > 0);
  }
  const key = SLUG_TO_BOOLEAN[storeSlug];
  return key ? Boolean(product[key]) : false;
}

export function hasAnyStock(
  product: {
    stores?: { stock?: number }[];
  } & Partial<LegacyStoreFlags>
): boolean {
  if (product.stores?.length) {
    return product.stores.some((entry) => (entry.stock ?? 0) > 0);
  }
  return slugsFromLegacyFlags(product).length > 0;
}

export function getStoreLabel(
  store: Pick<StoreInfo, "nameKa" | "nameEn">,
  locale: string
): string {
  return locale === "en" ? store.nameEn : store.nameKa;
}

export function cartItemHasStore(
  item: { storeSlugs?: string[] } & Partial<LegacyStoreFlags>,
  storeSlug: string
): boolean {
  if (item.storeSlugs?.length) {
    return item.storeSlugs.includes(storeSlug);
  }
  const key = SLUG_TO_BOOLEAN[storeSlug];
  return key ? Boolean(item[key]) : false;
}

export function getAvailableStoreSlugsFromCart(
  items: Array<{ storeSlugs?: string[] } & Partial<LegacyStoreFlags>>
): string[] {
  if (!items.length) return [];

  const slugSets = items.map((item) => {
    if (item.storeSlugs?.length) return item.storeSlugs;
    return slugsFromLegacyFlags(item);
  });

  return slugSets.reduce((common, current) =>
    common.filter((slug) => current.includes(slug))
  );
}
