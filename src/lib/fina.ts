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
  141: "LINEN",
  142: "PROTECTOR",
};

const CATEGORY_IMAGE: Record<string, string> = {
  MATTRESS: "/mattress.jpg",
  PILLOW: "/pillow.jpg",
  QUILT: "/quilttt.jpg",
  PAD: "/mattress.jpg",
  BED: "/bed1.jpg",
  LINEN: "/bed1.jpg",
  PROTECTOR: "/mattress.jpg",
  OTHERS: "/chair.jpg",
};

export const FINA_CATEGORY_LABELS: Record<string, { en: string; ka: string }> = {
  MATTRESS: { en: "Mattress", ka: "მატრასი" },
  PILLOW: { en: "Pillow", ka: "ბალიში" },
  QUILT: { en: "Quilt", ka: "საბანი" },
  PAD: { en: "Topper", ka: "ტოპერი" },
  BED: { en: "Bed", ka: "საწოლი" },
  LINEN: { en: "Bedding & linen", ka: "თეთრეული" },
  PROTECTOR: { en: "Protectors", ka: "დამცავები" },
  OTHERS: { en: "Others", ka: "სხვა" },
};

const CATEGORY_ALIASES: Record<string, string> = {
  MATTRESS: "MATTRESS",
  PILLOW: "PILLOW",
  QUILT: "QUILT",
  PAD: "PAD",
  TOPPER: "PAD",
  BED: "BED",
  LINEN: "LINEN",
  PROTECTOR: "PROTECTOR",
  OTHERS: "OTHERS",
  OTHER: "OTHERS",
};

const BRAND_SKIP = new Set(["WATERPROOF", "DOUBLE"]);

const BRAND_ALIASES: Record<string, string> = {
  IDAS: "IDAS",
  IDA: "IDAS",
  ISBIR: "ISBIR",
  ISBIRYATAK: "ISBIR",
  SEVYAT: "SEVYAT",
  SLEEPNICE: "SLEEPNICE",
  SLEEPANDBED: "SLEEPNICE",
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
  zugdidi: boolean;
  storeAvailability: FinaStoreAvailability[];
  groupId: number;
  groupName: string;
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

function normalizeBrandKey(brand: string) {
  return brand
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

function canonicalizeBrand(brand: string) {
  const key = normalizeBrandKey(brand);
  return BRAND_ALIASES[key] || brand;
}

function extractBrand(name: string) {
  const tokens = name
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Za-z0-9-]/g, "").toUpperCase())
    .filter((token) => /^[A-Z]/.test(token));

  if (!tokens.length) return "";

  let brand = tokens[0];
  if (brand === "SEA" && tokens[1] === "SLEEP") {
    brand = "SEA SLEEP";
  }
  if (BRAND_SKIP.has(brand)) return "";
  return canonicalizeBrand(brand);
}

function categoryFromGroup(groupId: number, groupName = "") {
  if (GROUP_TO_CATEGORY[groupId]) return GROUP_TO_CATEGORY[groupId];

  const name = groupName.toLowerCase();
  if (name.includes("მატრას")) return "MATTRESS";
  if (name.includes("ბალიშ")) return "PILLOW";
  if (name.includes("საბნ")) return "QUILT";
  if (name.includes("ტოპერ")) return "PAD";
  if (name.includes("დამცავ")) return "PROTECTOR";
  if (name.includes("თეთრეულ") || name.includes("გადასაფარ")) return "LINEN";
  if (name.includes("საწოლ")) return "BED";
  return "OTHERS";
}

function normalizeFilterCategory(value: string) {
  const key = value.trim().toUpperCase();
  return CATEGORY_ALIASES[key] || key;
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

async function finaPost<T>(path: string, body: unknown): Promise<T> {
  const token = await authenticate();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`FINA ${path} failed (${response.status}) ${detail}`.trim());
  }
  return response.json() as Promise<T>;
}

export function getFinaStoreIdBySlug(slug: string) {
  const match = Object.entries(FINA_STORES).find(
    ([, store]) => store.slug === slug
  );
  return match ? Number(match[0]) : null;
}

function mapProducts(
  products: FinaRawProduct[],
  prices: FinaPrice[],
  rest: FinaRest[],
  groupNames: Map<number, string>
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
    const salePrice = discounted ? Number(retail.discount_price) : originalPrice;
    const price = salePrice;
    const sales =
      discounted && originalPrice > 0
        ? Math.round((1 - salePrice / originalPrice) * 100)
        : undefined;

    const groupName = groupNames.get(product.group_id) || "";
    const category = categoryFromGroup(product.group_id, groupName);
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
      zugdidi: storeAvailability.some((s) => s.slug === "zugdidi" && s.inStock),
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
      groupName,
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
  const [productsRes, pricesRes, restRes, groupsRes] = await Promise.all([
    finaGet<{ products?: FinaRawProduct[] }>("/api/operation/getProducts"),
    finaGet<{ prices?: FinaPrice[] }>("/api/operation/getProductPrices"),
    finaGet<{ rest?: FinaRest[] }>("/api/operation/getProductsRest"),
    finaGet<{ groups?: { id: number; name: string }[] }>(
      "/api/operation/getProductGroups"
    ),
  ]);

  const groupNames = new Map(
    (groupsRes.groups || []).map((group) => [group.id, group.name])
  );

  return applyFinaOverrides(
    mapProducts(
      productsRes.products || [],
      pricesRes.prices || [],
      restRes.rest || [],
      groupNames
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
  return parseFloat(Number(product.price || 0).toFixed(2));
}

export function getFinaListPrice(product: {
  price?: number;
  originalPrice?: number;
  sales?: number;
}) {
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const onSale = originalPrice > price && price > 0;
  return {
    price,
    originalPrice: onSale ? originalPrice : undefined,
    sales: onSale
      ? product.sales || Math.round((1 - price / originalPrice) * 100)
      : undefined,
  };
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

export function sortFinaCatalog(
  products: FinaCatalogProduct[],
  sortBy?: string
) {
  const sorted = [...products];
  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price-high":
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "name":
      return sorted.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "ka")
      );
    default:
      return sorted;
  }
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
  const categories = String(filters?.category || "")
    .split(",")
    .map(normalizeFilterCategory)
    .filter((category) => category && category !== "ALL");
  const brands = (filters?.brands || [])
    .flatMap((brand) => String(brand).split(","))
    .map((brand) => canonicalizeBrand(brand.trim()))
    .filter(Boolean);
  const brandKeys = new Set(brands.map(normalizeBrandKey));
  const query = filters?.query?.toLowerCase().trim() || "";
  const storeSlug =
    filters?.storeSlug && filters.storeSlug !== "all"
      ? filters.storeSlug
      : "";

  return products.filter((product) => {
    if (categories.length && !categories.includes(product.category)) {
      return false;
    }
    if (
      brandKeys.size &&
      !brandKeys.has(normalizeBrandKey(product.brand || ""))
    ) {
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
      const haystack =
        `${product.title} ${product.titleEn} ${product.brand} ${product.code} ${product.groupName} ${product.category}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters?.popular === true && !product.popular) return false;
    if (filters?.onSale === true && !(product.sales && product.sales > 0)) {
      return false;
    }
    if (storeSlug) {
      const store = product.storeAvailability.find((s) => s.slug === storeSlug);
      if (!store?.inStock) return false;
    } else if (filters?.inStock === true && !hasFinaStock(product)) {
      return false;
    }
    return true;
  });
}

let resolvedCustomerId: number | null = null;

function extractFinaRecords(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["contragents", "customers", "data", "products"]) {
      if (Array.isArray(record[key])) {
        return record[key] as Array<Record<string, unknown>>;
      }
    }
  }
  return [];
}

function customerMatchesWebshop(row: Record<string, unknown>, code: string) {
  const haystack = `${row.code || ""} ${row.name || ""} ${row.name_eng || ""}`.toLowerCase();
  return (
    String(row.code || "").toUpperCase() === code.toUpperCase() ||
    /webshop|website|kipiani|online|ონლაინ/.test(haystack)
  );
}

export async function resolveFinaCustomerId(): Promise<number> {
  if (resolvedCustomerId) return resolvedCustomerId;

  const fromEnv = Number(process.env.FINA_CUSTOMER_ID || 0);
  if (fromEnv > 0) {
    resolvedCustomerId = fromEnv;
    return fromEnv;
  }

  const code = process.env.FINA_CUSTOMER_CODE || "WEBSHOP";

  try {
    const byCode = await finaGet<unknown>(
      `/api/operation/getCustomersByCode/${encodeURIComponent(code)}`
    );
    const match = extractFinaRecords(byCode).find((row) => Number(row.id) > 0);
    if (match) {
      resolvedCustomerId = Number(match.id);
      return resolvedCustomerId;
    }
  } catch (error) {
    console.warn("FINA getCustomersByCode failed:", error);
  }

  const all = await finaGet<unknown>("/api/operation/getCustomers");
  const customers = extractFinaRecords(all);
  const preferred = customers.find((row) => customerMatchesWebshop(row, code));
  const fallback = preferred || customers.find((row) => Number(row.id) > 0);

  if (!fallback) {
    throw new Error("Missing FINA_CUSTOMER_ID");
  }

  resolvedCustomerId = Number(fallback.id);
  if (!preferred) {
    console.warn(
      `FINA_CUSTOMER_ID is not set; using customer ${resolvedCustomerId} (${fallback.code || fallback.name}) for website sales`
    );
  }
  return resolvedCustomerId;
}

export async function saveFinaProductOut(params: {
  orderId: string;
  storeSlug: string;
  purpose?: string;
  comment?: string;
  items: Array<{ productId: string; qty: number; price: number }>;
}) {
  const store = getFinaStoreIdBySlug(params.storeSlug);
  if (!store) {
    throw new Error(`Unknown FINA store: ${params.storeSlug}`);
  }

  const customer = await resolveFinaCustomerId();
  const user = Number(process.env.FINA_USER_ID || 1);
  const staff = Number(process.env.FINA_STAFF_ID || process.env.FINA_USER_ID || 1);

  const products = params.items.map((item) => ({
    id: Number(item.productId),
    sub_id: 0,
    quantity: item.qty,
    price: Number(item.price),
  }));
  const amount = Number(
    products
      .reduce((sum, item) => sum + item.quantity * item.price, 0)
      .toFixed(2)
  );
  const now = new Date();
  const date = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);

  const result = await finaPost<{ id?: number; ex?: string | null }>(
    "/api/operation/saveDocProductOut",
    {
      id: 0,
      date,
      num_pfx: "",
      num: 0,
      purpose: params.purpose || `Website order ${params.orderId}`,
      amount,
      currency: "GEL",
      rate: 1,
      store,
      user,
      staff,
      project: Number(process.env.FINA_PROJECT_ID || 0),
      customer,
      is_vat: true,
      make_entry: true,
      pay_type: Number(process.env.FINA_PAY_TYPE || 1),
      w_type: 0,
      t_type: 1,
      t_payer: 2,
      w_cost: 0,
      foreign: false,
      comment: params.comment || params.orderId,
      products,
    }
  );

  if (result?.ex) {
    throw new Error(String(result.ex));
  }

  invalidateFinaCatalogCache();
  return result?.id || null;
}
