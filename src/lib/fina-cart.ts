import { CartItem } from "./types";
import {
  FinaCatalogProduct,
  getFinaDiscountedPrice,
  getFinaProductById,
  getFinaStockAtStore,
  getFinaStoreSlugs,
  hasFinaStock,
} from "./fina";
import { legacyFlagsFromSlugs } from "./store-utils";

export async function requireFinaProduct(productId: string) {
  const product = await getFinaProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
}

export function finaProductToCartItem(
  product: FinaCatalogProduct,
  size: string,
  qty: number
): CartItem {
  const storeSlugs = getFinaStoreSlugs(product);
  const flags = legacyFlagsFromSlugs(storeSlugs);

  return {
    productId: product.id,
    name: product.title,
    size: size || "N/A",
    qty,
    image: product.images[0] || "/mattress.jpg",
    price: getFinaDiscountedPrice(product).toFixed(2),
    storeSlugs,
    ...flags,
  };
}

export function assertFinaStock(
  product: FinaCatalogProduct,
  qty: number,
  storeSlug?: string
) {
  if (!hasFinaStock(product)) {
    throw new Error("Product is out of stock at all locations");
  }

  if (storeSlug && storeSlug !== "all") {
    const stock = getFinaStockAtStore(product, storeSlug);
    if (stock < qty) {
      throw new Error("Insufficient stock at the selected store");
    }
  }
}

export async function getFinaServerPrice(productId: string) {
  const product = await getFinaProductById(productId);
  if (!product) return null;
  const price = getFinaDiscountedPrice(product);
  if (price <= 0) return null;
  return { price, title: product.title, image: product.images[0] || "/mattress.jpg" };
}
