import { prisma } from "./prisma";

const RETAIL_PRICE_ID = Number(process.env.FINA_RETAIL_PRICE_ID || 3);
const CACHE_TTL_MS = 2 * 60 * 1000;

const GROUP_TO_CATEGORY: Record<number, string> = {
  134: "MATTRESS",
  139: "MATTRESS",
  135: "PILLOW",
  136: "QUILT",
  140: "PAD",
  138: "BED",
};

const CATEGORY_IMAGE: Record<string, string> = {
  MATTRESS: "/mattress.jpg",
  PILLOW: "/pillow.jpg",
  QUILT: "/quilttt.jpg",
  PAD: "/mattress.jpg",
  BED: "/bed1.jpg",
  OTHERS: "/chair.jpg",
};

const FINA_STORES: Record<
  number,
  { slug: string; nameKa: string; nameEn: string; address: string; city: string }
> = {
  7: {
    slug: "batumi",
    nameKa: "ბათუმი",
    nameEn: "Batumi",
    address: "ა. პუშკინის 115/117",
    city: "Batumi",
  },
  8: {
    slug: "batumi44",
    nameKa: "ბათუმი (44)",
    nameEn: "Batumi (Pushkin 44)",
    address: "ა. პუშკინის 44",
    city: "Batumi",
  },
  9: {
    slug: "kobuleti",
    nameKa: "ქობულეთი",
    nameEn: "Kobuleti",
    address: "შ. რუსთაველი 151",
    city: "Kobuleti",
  },
  10: {
    slug: "qutaisi",
    nameKa: "ქუთაისი",
    nameEn: "Kutaisi",
    address: "ი. ჭავჭავაძის 51",
    city: "Kutaisi",
  },
  11: {
    slug: "tbilisi",
    nameKa: "თბილისი",
    nameEn: "Tbilisi",
    address: "ბერბუკის 3",
    city: "Tbilisi",
  },
  13: {
    slug: "zugdidi",
    nameKa: "ზუგდიდი",
    nameEn: "Zugdidi",
    address: "დადიანის 5",
    city: "Zugdidi",
  },
};

type FinaRawProduct = {
  id: number;
  group_id: number;
  code: string;
  name: string;
  name_eng?: string | null;
  comment?: string | null;
  order_id?: number;
};

type FinaPrice = {
  product_id: number;
  price_id: number;
  price: number;
  discount_price?: number;
  discount_start?: string | null;
  discount_end?: string | null;
};

type FinaRest = {
  id: number;
  store: number;
  rest: number;
  reserve?: number;
};

export type FinaStoreAvailability = {
  storeId: string;
  slug: string;
  nameKa: string;
  nameEn: string;
  address: string;
  city: string;
  stock: number;
  inStock: boolean;
};

export type FinaCatalogProduct = {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  images: string[];
  brand: string;
  description: string;
  descriptionEn: string;
  popular: boolean;
  createdAt: Date;
  price?: number;
  originalPrice?: number;
  sales?: number;
  minSizePrice?: number;
  sizes: { id: string; size: string; price: number }[];
  tbilisi: boolean;
  batumi: boolean;
  batumi44: boolean;
  qutaisi: boolean;
  kobuleti: boolean;
  storeAvailability: FinaStoreAvailability[];
  groupId: number;
  code: string;
};

let tokenCache: { token: string; expiresAt: number } | null = null;
let catalogCache: { products: FinaCatalogProduct[]; expiresAt: number } | null =
  null;
let catalogPromise: Promise<FinaCatalogProduct[]> | null = null;

function getBaseUrl() {
  return (process.env.FINA_API_URL || "http://92.51.115.58:8085").replace(
    /\/$/,
    ""
  );
}

function isActiveDiscount(price: FinaPrice) {
  if (!price.discount_price || price.discount_price <= 0) return false;
  const now = Date.now();
  const start = price.discount_start ? Date.parse(price.discount_start) : NaN;
  const end = price.discount_end ? Date.parse(price.discount_end) : NaN;
  if (!Number.isNaN(start) && now < start) return false;
  if (!Number.isNaN(end) && now > end) return false;
  return true;
}

function extractBrand(name: string) {
  const token = name.trim().split(/\s+/)[0] || "";
  return token.replace(/[^A-Za-zა-ჰ0-9-]/g, "") || "KIPIANI";
}

function isDeletedProduct(product: FinaRawProduct) {
  const code = (product.code || "").toUpperCase();
  const name = product.name || "";
  return (
    product.id === 1 ||
    code.startsWith("DEL") ||
    name.includes("წაშლილი")
  );
}

async function authenticate() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const login = process.env.FINA_API_LOGIN;
  const password = process.env.FINA_API_PASSWORD;
  if (!login || !password) {
    throw new Error("Missing FINA API credentials");
  }

  const response = await fetch(`${getBaseUrl()}/api/authentication/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`FINA auth failed (${response.status})`);
  }

  const data = await response.json();
  if (!data?.token) {
    throw new Error(data?.ex || "FINA auth returned no token");
  }

  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 30 * 60 * 60 * 1000,
  };
  return data.token as string;
}

async function finaGet<T>(path: string): Promise<T> {
  const token = await authenticate();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`FINA ${path} failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function mapProducts(
  products: FinaRawProduct[],
  prices: FinaPrice[],
  rest: FinaRest[]
): FinaCatalogProduct[] {
  const priceByProduct = new Map<number, FinaPrice>();
  for (const price of prices) {
    if (price.price_id !== RETAIL_PRICE_ID) continue;
    priceByProduct.set(price.product_id, price);
  }

  const restByProduct = new Map<number, FinaRest[]>();
  for (const row of rest) {
    if (!FINA_STORES[row.store]) continue;
    const list = restByProduct.get(row.id) || [];
    list.push(row);
    restByProduct.set(row.id, list);
  }

  const mapped: FinaCatalogProduct[] = [];

  for (const product of products) {
    if (isDeletedProduct(product)) continue;
    const retail = priceByProduct.get(product.id);
    const originalPrice = retail?.price || 0;
    if (originalPrice <= 0) continue;

    const discounted = retail && isActiveDiscount(retail);
    const price = originalPrice;
    const sales =
      discounted && originalPrice > 0
        ? Math.round((1 - Number(retail.discount_price) / originalPrice) * 100)
        : undefined;

    const category = GROUP_TO_CATEGORY[product.group_id] || "OTHERS";
    const storeRows = restByProduct.get(product.id) || [];
    const storeAvailability: FinaStoreAvailability[] = storeRows.map((row) => {
      const store = FINA_STORES[row.store];
      const stock = Number(row.rest) || 0;
      return {
        storeId: String(row.store),
        slug: store.slug,
        nameKa: store.nameKa,
        nameEn: store.nameEn,
        address: store.address,
        city: store.city,
        stock,
        inStock: stock > 0,
      };
    });

    const flags = {
      tbilisi: storeAvailability.some((s) => s.slug === "tbilisi" && s.inStock),
      batumi: storeAvailability.some((s) => s.slug === "batumi" && s.inStock),
      batumi44: storeAvailability.some(
        (s) => s.slug === "batumi44" && s.inStock
      ),
      qutaisi: storeAvailability.some((s) => s.slug === "qutaisi" && s.inStock),
      kobuleti: storeAvailability.some(
        (s) => s.slug === "kobuleti" && s.inStock
      ),
    };

    mapped.push({
      id: String(product.id),
      title: product.name,
      titleEn: product.name_eng || product.name,
      category,
      images: [CATEGORY_IMAGE[category] || "/chair.jpg"],
      brand: extractBrand(product.name),
      description: product.comment || "",
      descriptionEn: product.comment || "",
      popular: storeAvailability.some((s) => s.inStock),
      createdAt: new Date(0),
      price,
      originalPrice: discounted ? originalPrice : undefined,
      sales,
      minSizePrice: price,
      sizes: [],
      ...flags,
      storeAvailability,
      groupId: product.group_id,
      code: product.code,
    });
  }

  return mapped.sort((a, b) => Number(b.id) - Number(a.id));
}

export function isRemoteProductImage(url: string) {
  return /^https?:\/\//i.test(url);
}

export function invalidateFinaCatalogCache() {
  catalogCache = null;
  catalogPromise = null;
}

async function applyFinaOverrides(products: FinaCatalogProduct[]) {
  try {
    const overrides = await prisma.finaProductOverride.findMany();
    if (!overrides.length) return products;

    const byId = new Map(overrides.map((row) => [row.finaId, row]));
    return products.map((product) => {
      const override = byId.get(product.id);
      if (!override) return product;

      const images = (override.images || []).filter(isRemoteProductImage);
      return {
        ...product,
        title: override.title?.trim() || product.title,
        titleEn: override.titleEn?.trim() || product.titleEn,
        description: override.description ?? product.description,
        descriptionEn: override.descriptionEn ?? product.descriptionEn,
        brand: override.brand?.trim() || product.brand,
        images: images.length ? images : product.images,
      };
    });
  } catch (error) {
    console.error("FINA product overrides failed to load:", error);
    return products;
  }
}

async function loadCatalog(): Promise<FinaCatalogProduct[]> {
  const [productsRes, pricesRes, restRes] = await Promise.all([
    finaGet<{ products?: FinaRawProduct[] }>("/api/operation/getProducts"),
    finaGet<{ prices?: FinaPrice[] }>("/api/operation/getProductPrices"),
    finaGet<{ rest?: FinaRest[] }>("/api/operation/getProductsRest"),
  ]);

  return applyFinaOverrides(
    mapProducts(
      productsRes.products || [],
      pricesRes.prices || [],
      restRes.rest || []
    )
  );
}

export function getFinaStoreList() {
  return Object.values(FINA_STORES);
}

export async function getFinaProductById(productId: string) {
  const catalog = await getFinaCatalog();
  return catalog.find((product) => product.id === String(productId)) || null;
}

export function getFinaDiscountedPrice(product: FinaCatalogProduct) {
  const base = Number(product.price || 0);
  if (product.sales && product.sales > 0) {
    return parseFloat((base * (1 - product.sales / 100)).toFixed(2));
  }
  return parseFloat(base.toFixed(2));
}

export function getFinaStoreSlugs(product: FinaCatalogProduct) {
  return product.storeAvailability
    .filter((store) => store.inStock)
    .map((store) => store.slug);
}

export function getFinaStockAtStore(
  product: FinaCatalogProduct,
  storeSlug: string
) {
  if (!storeSlug || storeSlug === "all") {
    return product.storeAvailability.reduce((sum, store) => sum + store.stock, 0);
  }
  return (
    product.storeAvailability.find((store) => store.slug === storeSlug)?.stock ??
    0
  );
}

export function hasFinaStock(product: FinaCatalogProduct) {
  return product.storeAvailability.some((store) => store.inStock);
}

export function isKnownFinaStoreSlug(slug: string) {
  return Object.values(FINA_STORES).some((store) => store.slug === slug);
}

export async function getFinaCatalog(): Promise<FinaCatalogProduct[]> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return catalogCache.products;
  }

  if (!catalogPromise) {
    catalogPromise = loadCatalog()
      .then((products) => {
        catalogCache = {
          products,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        return products;
      })
      .finally(() => {
        catalogPromise = null;
      });
  }

  return catalogPromise;
}

export function filterFinaCatalog(
  products: FinaCatalogProduct[],
  filters?: {
    category?: string;
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    query?: string;
    inStock?: boolean;
    popular?: boolean;
    onSale?: boolean;
    storeSlug?: string;
  }
) {
  const category = filters?.category
    ? String(filters.category).toUpperCase()
    : "";
  const query = filters?.query?.toLowerCase().trim() || "";
  const storeSlug =
    filters?.storeSlug && filters.storeSlug !== "all"
      ? filters.storeSlug
      : "";

  return products.filter((product) => {
    if (category && category !== "ALL" && product.category !== category) {
      return false;
    }
    if (filters?.brands?.length && !filters.brands.includes(product.brand)) {
      return false;
    }
    const price = product.price || 0;
    if (filters?.minPrice != null && price < Number(filters.minPrice)) {
      return false;
    }
    if (filters?.maxPrice != null && price > Number(filters.maxPrice)) {
      return false;
    }
    if (query) {
      const haystack = `${product.title} ${product.titleEn} ${product.brand} ${product.code}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters?.popular === true && !product.popular) return false;
    if (filters?.onSale === true && !(product.sales && product.sales > 0)) {
      return false;
    }
    if (storeSlug) {
      const store = product.storeAvailability.find((s) => s.slug === storeSlug);
      if (!store?.inStock) return false;
    } else if (filters?.inStock === true && !product.popular) {
      return false;
    }
    return true;
  });
}
