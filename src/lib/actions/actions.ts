"use server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../prisma";
import { updateProductSchema, finaProductOverrideSchema } from "../validators";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { requireAdmin } from "../auth-helpers";
import { cookies } from "next/headers";
import { syncProductStores } from "./store.actions";
import { getProductStoreSlugs } from "../store-utils";
import { filterFinaCatalog, getFinaCatalog, getFinaProductById, hasFinaStock } from "../fina";
import { updateFinaProductOverride } from "./fina-product.actions";

export async function convertToPlainObject<T>(value: T): Promise<T> {
  return JSON.parse(JSON.stringify(value));
}

export async function getSingleProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: { id: id },
    include: {
      sizes: true,
      stores: {
        include: { store: true },
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    price: product.price ? Number(product.price) : undefined,
    storeIds: product.stores.map((entry) => entry.storeId),
    storeSlugs: getProductStoreSlugs(product),
    sizes: product.sizes?.map(size => ({
      ...size,
      price: Number(size.price)
    })) || []
  };
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
    const productExist = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExist) throw new Error("not found");

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products");
    revalidateTag("products");
    return {
      success: true,
      message: "deleted",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    await requireAdmin();
    const product = updateProductSchema.parse(data);

    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) throw new Error("Product not found");

    const normalizedCategory =
      product.category === "bundle" ? "bundle" : product.category;

    const updateData: any = {
      title: product.title,
      titleEn: product.titleEn,
      description: product.description,
      descriptionEn: product.descriptionEn,
      brand: product.brand,
      images: product.images,
      category: normalizedCategory,
      sales: product.sales,
      popular: product.popular,
    };

    // Handle price for OTHERS category or sizes for other categories
    if (product.category === "OTHERS") {
      updateData.price = new Prisma.Decimal(product.price!);
      // Remove all sizes for OTHERS category
      updateData.sizes = {
        deleteMany: {},
      };
    } else {
      updateData.sizes = {
        deleteMany: {},
        create: product.sizes!.map((sizeData) => ({
          size: sizeData.size,
          price: new Prisma.Decimal(sizeData.price),
        })),
      };
    }

    await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

    if (product.storeStock?.length) {
      await syncProductStores(product.id, product.storeStock);
    } else if (product.storeIds) {
      await syncProductStores(
        product.id,
        product.storeIds.map((storeId) => ({ storeId, stock: 1 }))
      );
    }

    revalidatePath("/admin/products");
    revalidateTag("products");

    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return { success: false, message: formatError(error) };
  }
}

export async function getProductCategories() {
  const catalog = await getFinaCatalog();
  return Array.from(new Set(catalog.map((product) => product.category))).sort();
}

async function fetchProductsFromDb(
  page: number,
  pageSize: number,
  getAll: boolean,
  filters: Record<string, unknown> | undefined,
  selectedStore: string
) {
  const catalog = await getFinaCatalog();
  const filtered = filterFinaCatalog(catalog, {
    category: filters?.category as string | undefined,
    brands: filters?.brands as string[] | undefined,
    minPrice: filters?.minPrice as number | undefined,
    maxPrice: filters?.maxPrice as number | undefined,
    query: filters?.query as string | undefined,
    inStock: true,
    popular: filters?.popular as boolean | undefined,
    onSale: filters?.onSale as boolean | undefined,
    storeSlug: selectedStore,
  });

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
