"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { requireAdmin } from "../auth-helpers";
import { finaProductOverrideSchema } from "../validators";
import {
  getFinaProductById,
  invalidateFinaCatalogCache,
  isRemoteProductImage,
} from "../fina";

export type FinaProductEditData = {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  brand: string;
  category: string;
  price: number;
  images: string[];
  storeAvailability: {
    nameKa: string;
    stock: number;
    inStock: boolean;
  }[];
};

function formatError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.errors.map((item) => item.message).join(". ");
  }
  if (error instanceof Error) return error.message;
  return "Operation failed";
}

export async function getFinaProductForEdit(
  productId: string
): Promise<FinaProductEditData | null> {
  const product = await getFinaProductById(productId);
  if (!product) return null;

  return {
    id: product.id,
    code: product.code,
    title: product.title,
    titleEn: product.titleEn,
    description: product.description || "",
    descriptionEn: product.descriptionEn || "",
    brand: product.brand || "",
    category: product.category,
    price: Number(product.price || 0),
    images: (product.images || []).filter(isRemoteProductImage),
    storeAvailability: product.storeAvailability.map((store) => ({
      nameKa: store.nameKa,
      stock: store.stock,
      inStock: store.inStock,
    })),
  };
}

export async function updateFinaProductOverride(
  data: z.infer<typeof finaProductOverrideSchema>
) {
  try {
    await requireAdmin();
    const parsed = finaProductOverrideSchema.parse(data);
    const product = await getFinaProductById(parsed.finaId);
    if (!product) {
      return { success: false, message: "FINA product not found" };
    }

    const images = parsed.images.filter(isRemoteProductImage);

    await prisma.finaProductOverride.upsert({
      where: { finaId: parsed.finaId },
      create: {
        finaId: parsed.finaId,
        images,
        title: parsed.title,
        titleEn: parsed.titleEn,
        description: parsed.description,
        descriptionEn: parsed.descriptionEn,
        brand: parsed.brand,
      },
      update: {
        images,
        title: parsed.title,
        titleEn: parsed.titleEn,
        description: parsed.description,
        descriptionEn: parsed.descriptionEn,
        brand: parsed.brand,
      },
    });

    invalidateFinaCatalogCache();
    revalidatePath("/", "layout");

    return { success: true, message: "Product updated" };
  } catch (error) {
    console.error("Error updating FINA product:", error);
    return { success: false, message: formatError(error) };
  }
}
