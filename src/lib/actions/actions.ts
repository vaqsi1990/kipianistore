"use server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ProductSchema, updateProductSchema } from "../validators";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth-helpers";

export async function convertToPlainObject<T>(value: T): Promise<T> {
  return JSON.parse(JSON.stringify(value));
}

export async function getSingleProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: { id: id },
    include: {
      sizes: true,
    },
  });

  if (!product) return null;

  // Convert Decimal objects to numbers
  return {
    ...product,
    price: product.price ? Number(product.price) : undefined,
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

export async function createProduct(data: z.infer<typeof ProductSchema>) {
  try {
    await requireAdmin();
    const product = ProductSchema.parse(data);

    const normalizedCategory =
      product.category === "bundle" ? "bundle" : product.category;
    const { sizes, ...productData } = product;

    const createData: any = {
      ...productData,
      category: normalizedCategory as any,
    };

    // Handle price for OTHERS category or sizes for other categories
    if (product.category === "OTHERS") {
      createData.price = new Prisma.Decimal(product.price!);
    } else {
      createData.sizes = {
        create: sizes!.map((sizeData) => ({
          size: sizeData.size,
          price: new Prisma.Decimal(sizeData.price),
        })),
      };
    }

    const createdProduct = await prisma.product.create({
      data: createData,
      include: {
        sizes: true,
      },
    });

    revalidatePath("/admin");

    return { success: true, message: "Product created successfully" };
  } catch (error) {
    console.error("Error in createProduct:", error);
    return { success: false, message: formatError(error) };
  }
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
      tbilisi: product.tbilisi,
      batumi: product.batumi,
      batumi44: product.batumi44,
      qutaisi: product.qutaisi,
      kobuleti: product.kobuleti,
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

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return { success: false, message: formatError(error) };
  }
}

export async function getAllProducts(page = 1, pageSize = 20, getAll = false, filters?: any) {
  try {
          // Build where clause based on filters
      const where: any = {};
      
      if (filters?.category) {
        where.category = filters.category.toUpperCase();
      }
      
      if (filters?.brands && filters.brands.length > 0) {
        where.brand = { in: filters.brands };
      }
      
      if (filters?.minPrice || filters?.maxPrice) {
        where.OR = [
          { price: { gte: filters.minPrice || 0, lte: filters.maxPrice || 999999 } },
          { sizes: { some: { price: { gte: filters.minPrice || 0, lte: filters.maxPrice || 999999 } } } }
        ];
      }
      
      if (filters?.query) {
        where.OR = [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { titleEn: { contains: filters.query, mode: 'insensitive' } },
          { brand: { contains: filters.query, mode: 'insensitive' } }
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip: getAll ? 0 : (page - 1) * pageSize,
          take: getAll ? undefined : pageSize,
          select: {
            id: true,
            title: true,
            titleEn: true,
            category: true,
            images: true,
            brand: true,
            price: true,
            sales: true,
            popular: true,
            createdAt: true,
            sizes: {
              select: {
                price: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ]);

    // For each product, calculate the minimum size price if sizes exist
    const productsWithMinPrice = products.map((product) => {
      let minSizePrice = undefined;
      if (product.sizes && product.sizes.length > 0) {
        minSizePrice = product.sizes
          .map((s) => Number(s.price))
          .reduce((min, p) => (p < min ? p : min), Infinity);
      }
      return {
        ...product,
        price: product.price ? Number(product.price) : undefined,
        minSizePrice: minSizePrice !== Infinity ? minSizePrice : undefined,
        sizes: product.sizes?.map(size => ({
          ...size,
          price: Number(size.price)
        })) || []
      };
    });

    return { products: productsWithMinPrice, total };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], total: 0 };
  }
}

export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
    include: {
      sizes: true,
    },
  });

  if (!data) return null;

  // Convert Decimal objects to numbers
  return {
    ...data,
    price: data.price ? Number(data.price) : undefined,
    sizes: data.sizes?.map(size => ({
      ...size,
      price: Number(size.price)
    })) || []
  };
}

export async function getSimilarProducts(
  productId: string,
  category: string,
  limit: number = 4
) {
  try {
    // Handle category conversion like other functions
    const normalizedCategory =
      category === "bundle" ? "bundle" : category.toUpperCase();

    const products = await prisma.product.findMany({
      where: {
        category: normalizedCategory as any,
        id: {
          not: productId,
        },
      },
      include: {
        sizes: {
          select: {
            id: true,
            size: true,
            price: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      ...product,
      price: product.price ? Number(product.price) : undefined,
      sizes: product.sizes.map((size) => ({
        ...size,
        price: Number(size.price),
      })),
    }));
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

  const counts = await prisma.product.groupBy({
    by: ["category"],
    _count: { category: true },
  });

  cachedCounts = counts;
  lastFetched = now;

  return counts;
}
