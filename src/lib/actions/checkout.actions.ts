"use server";

import {
  getFinaDiscountedPrice,
  getFinaProductById,
} from "../fina";

export type FinaSummaryStore = {
  slug: string;
  nameKa: string;
  nameEn: string;
  address: string;
  city: string;
  stock: number;
  inStock: boolean;
};

export type FinaSummaryItem = {
  productId: string;
  qty: number;
  size: string;
  title: string;
  titleEn: string;
  code: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  sales: number;
  storeAvailability: FinaSummaryStore[];
};

export async function getFinaSummaryItems(
  items: Array<{ productId: string; qty: number; size?: string }>
): Promise<FinaSummaryItem[]> {
  const result: FinaSummaryItem[] = [];

  for (const item of items) {
    const product = await getFinaProductById(item.productId);
    if (!product) continue;

    result.push({
      productId: product.id,
      qty: item.qty,
      size: item.size || "N/A",
      title: product.title,
      titleEn: product.titleEn,
      code: product.code,
      brand: product.brand || "",
      category: product.category,
      image: product.images[0] || "/mattress.jpg",
      price: getFinaDiscountedPrice(product),
      originalPrice: Number(product.price || 0),
      sales: product.sales || 0,
      storeAvailability: product.storeAvailability.map((store) => ({
        slug: store.slug,
        nameKa: store.nameKa,
        nameEn: store.nameEn,
        address: store.address,
        city: store.city,
        stock: store.stock,
        inStock: store.inStock,
      })),
    });
  }

  return result;
}
