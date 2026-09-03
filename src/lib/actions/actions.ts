"use server";
import { z } from "zod";
import { prisma } from "../prisma";
import { updateProductSchema, finaProductOverrideSchema } from "../validators";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { requireAdmin } from "../auth-helpers";
import { cookies } from "next/headers";
import { filterFinaCatalog, getFinaCatalog, getFinaProductById, getFinaStoreList, hasFinaStock, invalidateFinaCatalogCache, sortFinaCatalog } from "../fina";
import { updateFinaProductOverride } from "./fina-product.actions";

export async function convertToPlainObject<T>(value: T): Promise<T> {
  return JSON.parse(JSON.stringify(value));
}

export async function getSingleProduct(id: string) {
    const product = await getFinaProductById(id);
    if (product) {
      return {
        ...product,
        storeIds: product.storeAvailability.map((entry) => entry.storeId),
        storeSlugs: product.storeAvailability
          .filter((entry) => entry.inStock)
          .map((entry) => entry.slug),
        sizes: product.sizes || [],
      };
    }
    return null;
}

export async function formatError(error: any) {
  if (error.name === "ZodError") {
    // Handle Zod error
    const fieldErrors = Object.keys(error.errors).map(
      (field) => error.errors[field].message
    );

    return fieldErrors.join(". ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    // Handle Prisma error
    const field = error.meta?.target ? error.meta.target[0] : "Field";
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    // Handle other errors
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}

export async function createProduct(data: z.infer<typeof finaProductOverrideSchema>) {
  return updateFinaProductOverride(data);
}

export async function deleteProduct(id: string) {
  try {
    await requireAdmin();
    const override = await prisma.finaProductOverride.findUnique({
      where: { finaId: id },
    });
    if (override) {
      await prisma.finaProductOverride.delete({
        where: { finaId: id },
      });
    }

    const { invalidateFinaCatalogCache } = await import("../fina");
    invalidateFinaCatalogCache();
    revalidatePath("/adminall");
    revalidateTag("products");
    return {
      success: true,
      message: override ? "Site override deleted" : "No site override to delete",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateProduct(data: z.infer<typeof updateProductSchema> | Record<string, any>) {
  try {
    const id = String(data.id || data.finaId || "");
    if (!id) return { success: false, message: "Id is required" };
    return updateFinaProductOverride({
      finaId: id,
      images: Array.isArray(data.images) ? data.images : [],
      title: data.title,
      titleEn: data.titleEn,
      description: data.description || "",
      descriptionEn: data.descriptionEn || "",
      brand: data.brand || "",
    });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return { success: false, message: formatError(error) };
  }
}

export async function getProductCategories() {
  const catalog = await getFinaCatalog();
  return Array.from(new Set(catalog.map((product) => product.category))).sort();
}

const FILTER_CATEGORY_ORDER = [
  "MATTRESS",
  "PILLOW",
  "QUILT",
  "PAD",
  "BED",
  "LINEN",
  "PROTECTOR",
  "OTHERS",
];

export async function getListFilterOptions() {
  try {
    const catalog = await getFinaCatalog();
    const inStock = catalog.filter((product) => hasFinaStock(product));
    const categorySet = new Set(
      inStock.map((product) => product.category).filter(Boolean)
    );
    const categories = [
      ...FILTER_CATEGORY_ORDER.filter((category) => categorySet.has(category)),
      ...Array.from(categorySet)
        .filter((category) => !FILTER_CATEGORY_ORDER.includes(category))
        .sort(),
    ];
    const brands = Array.from(
      new Set(inStock.map((product) => product.brand).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const prices = inStock
      .map((product) => Number(product.price || 0))
      .filter((price) => price > 0);
    return {
      categories,
      brands,
      stores: getFinaStoreList().map((store) => ({
        slug: store.slug,
        nameKa: store.nameKa,
        nameEn: store.nameEn,
        address: store.address,
      })),
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  } catch (error) {
    console.error("Error loading FINA filter options:", error);
    return { categories: [], brands: [], stores: [], minPrice: 0, maxPrice: 0 };
  }
}

async function fetchProductsFromDb(
  page: number,
  pageSize: number,
  getAll: boolean,
  filters: Record<string, unknown> | undefined,
  selectedStore: string
) {
  const catalog = await getFinaCatalog();
  const filtered = sortFinaCatalog(
    filterFinaCatalog(catalog, {
      category: filters?.category as string | undefined,
      brands: filters?.brands as string[] | undefined,
      minPrice: filters?.minPrice as number | undefined,
      maxPrice: filters?.maxPrice as number | undefined,
      query: filters?.query as string | undefined,
      inStock: true,
      popular: filters?.popular as boolean | undefined,
      onSale: filters?.onSale as boolean | undefined,
      storeSlug: selectedStore,
    }),
    filters?.sortBy as string | undefined
  );

  const total = filtered.length;
  const pageItems = getAll
    ? filtered
    : filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    products: pageItems,
    total,
  };
}

const getCachedProducts = unstable_cache(
  async (
    page: number,
    pageSize: number,
    filtersKey: string,
    selectedStore: string
  ) => {
    const filters = filtersKey ? JSON.parse(filtersKey) : undefined;
    return fetchProductsFromDb(page, pageSize, false, filters, selectedStore);
  },
  ["products-list"],
  { revalidate: 120, tags: ["products"] }
);

export async function getAllProducts(page = 1, pageSize = 20, getAll = false, filters?: any) {
  try {
      const cookieStore = await cookies();
      const selectedStore =
        filters?.storeSlug ||
        cookieStore.get("selectedStore")?.value ||
        "all";

      if (getAll) {
        return fetchProductsFromDb(page, pageSize, true, filters, selectedStore);
      }

      const filtersKey = filters ? JSON.stringify(filters) : "";
      return getCachedProducts(page, pageSize, filtersKey, selectedStore);
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], total: 0 };
  }
}

export async function getProductById(productId: string) {
  try {
    const product = await getFinaProductById(productId);
    if (product) {
      return {
        ...product,
        storeIds: product.storeAvailability.map((entry) => entry.storeId),
        storeStock: product.storeAvailability.map((entry) => ({
          storeId: entry.storeId,
          stock: entry.stock,
        })),
        storeSlugs: product.storeAvailability
          .filter((entry) => entry.inStock)
          .map((entry) => entry.slug),
      };
    }
  } catch (error) {
    console.error("Error fetching FINA product:", error);
  }

  return null;
}

export async function getSimilarProducts(
  productId: string,
  category: string,
  limit: number = 4
) {
  try {
    const catalog = await getFinaCatalog();
    const normalizedCategory =
      category === "bundle" ? "bundle" : category.toUpperCase();

    return catalog
      .filter(
        (product) =>
          product.id !== String(productId) &&
          product.category === normalizedCategory &&
          hasFinaStock(product)
      )
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return [];
  }
}

let cachedCounts: any = null;
let lastFetched: number = 0;

export async function getProductCategoryCounts() {
  const now = Date.now();
  if (cachedCounts && now - lastFetched < 60_000) {
    return cachedCounts;
  }

  const catalog = await getFinaCatalog();
  const countMap = new Map<string, number>();
  for (const product of catalog) {
    if (!hasFinaStock(product)) continue;
    countMap.set(product.category, (countMap.get(product.category) || 0) + 1);
  }

  cachedCounts = Array.from(countMap.entries()).map(([category, count]) => ({
    category,
    _count: { category: count },
  }));
  lastFetched = now;

  return cachedCounts;
}
