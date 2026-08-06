"use client";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import ProductImage from "../ProductImage";
import { getProductById } from "@/lib/actions/actions";
import SimilarProducts from "@/components/SimilarProducts";
import { toast } from "sonner";
import { useCart } from "@/lib/context/CartContext";
import { CartItem } from "@/lib/types";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// SimpleDecimal class removed - now using regular numbers

interface ProductSize {
  id: string;
  size: string;
  price: number;
}

interface Product {
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
  tbilisi: boolean;
  batumi: boolean;
  batumi44: boolean;
  qutaisi: boolean;
  kobuleti: boolean;
  sizes?: ProductSize[];
  price?: number; // For OTHERS category products
  sales?: number;
}

const Page = (props: { params: { id: string; locale: string } }) => {
  const { id, locale } = props.params;
  const t = useTranslations("productDetail");
  const { addToCartOptimistic, refreshCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const { data: session } = useSession();
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        // The data is already converted to numbers by the server action
        if (data) {
          const productWithPrices = {
            ...data,
            sizes: data.sizes || [],
            price: data.price || undefined,
            sales: data.sales || undefined,
          };
          setProduct(productWithPrices as Product);
          // Set the first size as default selected for products with sizes
          if (
            data.sizes &&
            Array.isArray(data.sizes) &&
            data.sizes.length > 0
          ) {
            setSelectedSize(data.sizes[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const getSelectedSizeData = () => {
    if (!product || !selectedSize || !product.sizes) return null;
    return product.sizes.find((size) => size.id === selectedSize);
  };

  const isOthersProduct = () => {
    return product?.category === "OTHERS";
  };

  const getProductPrice = () => {
    if (isOthersProduct() && product?.price) {
      return product.price;
    }
    if (selectedSizeData) {
      return selectedSizeData.price;
    }
    return 0;
  };

  const getDiscountedPrice = () => {
    const basePrice = getProductPrice();
    if (product?.sales && product.sales > 0) {
      return basePrice * (1 - product.sales / 100);
    }
    return basePrice;
  };

  const formatSizeDisplay = (sizeEnum: string) => {
    // Convert SIZE_80_190 to 80-190 format
    return sizeEnum.replace("SIZE_", "").replace("_", "-");
  };

  // Get localized title and description based on locale
  const getLocalizedTitle = () => {
    return locale === "en"
      ? product?.titleEn || product?.title
      : product?.title || product?.titleEn;
  };

  const getLocalizedDescription = () => {
    return locale === "en"
      ? product?.descriptionEn || product?.description
      : product?.description || product?.descriptionEn;
  };

  // Fallback translations for debugging
  const getTranslation = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation || fallback;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return fallback;
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // For OTHERS products, no size selection needed
    if (isOthersProduct()) {
      if (!product.price) {
        toast.error("Product price not available");
        return;
      }
    } else {
      // For sized products, size selection is required
      if (!selectedSize) {
        toast.error("Please select a size");
        return;
      }
    }

    const selectedSizeData = getSelectedSizeData();
    const basePrice = getProductPrice();
    const finalPrice = getDiscountedPrice();

    // Show toast immediately for better UX
    toast.success("პროდუქტი დამატებულია კალათაში");

    // Optimistically update the cart UI
    const newItem: CartItem = {
      productId: product.id,
      name: getLocalizedTitle() || product.title || "Product",
      size: isOthersProduct() ? "N/A" : selectedSizeData?.size || "",
      qty: 1,
      image: product.images[0],
      price: finalPrice.toFixed(2),
    };

    addToCartOptimistic(newItem);

    setAddingToCart(true);
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          size: isOthersProduct() ? "N/A" : selectedSizeData?.size || "",
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("კალათაში დამატება ვერ მოხერხდა");
      }

      // Refresh cart to get the actual server state
      await refreshCart();
      
      // Show success message
      toast.success("პროდუქტი დაემატა კალათაში");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("კალათაში დამატება ვერ მოხერხდა");
      // Refresh cart to revert optimistic update on error
      await refreshCart();
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center text-lg font-semibold mt-20">
        {getTranslation("product.productNotFound", "Product not found")}
      </div>
    );
  }

  const selectedSizeData = getSelectedSizeData();
  const hasNewStructure =
    product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;
  const localizedTitle = getLocalizedTitle();
  const localizedDescription = getLocalizedDescription();

  return (
    <>
      <div className="py-2 mt-[120px] min-h-screen mx-auto md:py-4 ">
        <div className="container mx-auto">
          <div className="grid max-w-7xl mx-auto grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
            {/* Product Images */}
            <div className="w-full">
              <ProductImage image={product.images} />
            </div>

            {/* Product Details */}
            <div className="space-y-3 lg:max-w-md">
              {/* Product Title */}
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-[20px] font-semibold text-white leading-tight">
                    {localizedTitle}
                  </h1>
                  {product.sales && product.sales > 0 && (
                    <span className="text-xs text-white font-bold bg-red-500 px-2 py-1 rounded-full">
                      -{product.sales}% SALE
                    </span>
                  )}
                </div>

                {/* Brand - only show for non-OTHERS products */}
                {!isOthersProduct() && product.brand && (
                  <p className="text-[18px]  font-bold  mb-1 text-white">
                    {getTranslation("product.brand", "Brand")}:{" "}
                    <span className="font-medium uppercase text-white">
                      {product.brand}
                    </span>
                  </p>
                )}

                <p className="text-[18px]  font-bold text-white">
                  {getTranslation("product.category", "Category")}:{" "}
                  <span className="font-medium uppercase text-white">
                    {product.category}
                  </span>
                </p>
              </div>

              {/* Size and Price Section */}
              <div className="flex flex-col gap-2 mb-4">
                {!isOthersProduct() && (
                  <div className="flex flex-row items-start gap-2">
                    <span className="text-[18px] text-white font-semibold">
                      {getTranslation("product.size", "Size")}:
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {product.sizes?.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.id)}
                          className={`px-3 py-1 rounded-lg font-bold text-[18px] ${selectedSize === size.id
                              ? "bg-[#bbb272] text-black"
                              : "bg-white text-black"
                            }`}
                        >
                          {formatSizeDisplay(size.size)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[18px] text-white font-semibold">
                    {getTranslation("product.price", "Price")}:
                  </span>
                  <span className="text-[20px] font-bold text-[#bbb272]">
                    ₾{getDiscountedPrice().toFixed(2)}
                  </span>
                  {product.sales && product.sales > 0 && (
                    <span className="text-sm line-through text-white ml-2">
                      ₾{getProductPrice().toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Description */}

              {/* Availability */}
              <div className="pb-2">
                <h3 className="text-[18px] md:text-[20px] sm:text-base font-semibold text-white mb-2">
                  {getTranslation("product.availability", "Availability")}
                </h3>
                <div className="space-y-1">
                  {product?.tbilisi && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#bbb272] rounded-full"></div>
                        <span className="text-[18px] md:text-[20px] font-medium text-black">
                          {getTranslation("locations.tbilisi", "Tbilisi")}
                        </span>
                      </div>
                      <span className=" text-[18px] md:text-[20px] text-black">
                        {getTranslation(
                          "locations.tbilisiAddress",
                          "Tbilisi, T. Eristavi 1"
                        )}
                      </span>
                    </div>
                  )}

                  {product?.batumi && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#bbb272] rounded-full"></div>
                        <span className="text-[16px] md:text-[20px] sm:text-base font-medium text-black">
                          {getTranslation("locations.batumi", "Batumi")}
                        </span>
                      </div>
                      <span className="text-[16px] md:text-[20px] text-black">
                        {getTranslation(
                          "locations.batumiAddress",
                          " A. Pushkin 117"
                        )}
                      </span>

                    </div>
                  )}
                  {product?.batumi44 && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#bbb272] rounded-full"></div>
                        <span className="text-[16px] md:text-[20px] sm:text-base font-medium text-black">
                          {getTranslation("locations.batumi", "Batumi")}
                        </span>
                      </div>
                      <span className="text-[16px] md:text-[20px] text-black">
                        {getTranslation(
                          "locations.batumiAddress2",
                          " A. Pushkin 44"
                        )}
                      </span>

                    </div>
                  )}

                  {product?.qutaisi && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#bbb272] rounded-full"></div>
                        <span className="text-[16px] md:text-[20px] font-medium text-black">
                          {getTranslation("locations.qutaisi", "Kutaisi")}
                        </span>
                      </div>
                      <span className="text-[16px] md:text-[20px] text-black">
                        {getTranslation(
                          "locations.qutaisiAddress",
                          "Kutaisi, Z. Purtzeladze 15"
                        )}
                      </span>
                    </div>
                  )}

                  {product?.kobuleti && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#bbb272] rounded-full"></div>
                        <span className="text-[16px] md:text-[20px] font-medium text-black">
                          {getTranslation("locations.kobuleti", "Kobuleti")}
                        </span>
                      </div>
                      <span className="text-[16px] md:text-[20px] text-black">
                        {getTranslation(
                          "locations.kobuletiAddress",
                          "Kobuleti, Central Street 15"
                        )}
                      </span>
                    </div>
                  )}
                 

                  {!product?.tbilisi &&
                    !product?.batumi &&
                    !product?.qutaisi &&
                    !product?.kobuleti && (
                      <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <span className="text-[18px] sm:text-base text-red-700 font-medium">
                            {getTranslation(
                              "product.outOfStock",
                              "Out of stock at all locations"
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Add to Cart Button */}
              {session && (
                <div className="pt-1">
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      (!isOthersProduct() && !selectedSize) || addingToCart
                    }
                    className={`w-full md:w-[50%] px-4 py-2 text-[20px] md:text-[20px] font-bold text-white bg-[#bbb272] rounded-lg  transition-colors ${(isOthersProduct() || selectedSize) && !addingToCart
                        ? "bg-[#bbb272] text-white"
                        : "bg-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <span>
                      {addingToCart
                        ? "დამატება..."
                        : getTranslation("product.addToCart", "Add to Cart")}
                    </span>
                  </button>
                </div>
              )}
              {!session && (
                <div className="pt-1">
                  <Button
                    variant="outline"
                    className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#bbb272] rounded-lg  transition-colors"
                  >
                    <Link href="/sign-in">შედით თქვენ აქაუნთზე</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="container mx-auto mt-6">
            <div className="max-w-7xl mx-auto">
              <div className="pb-2">
                <h3 className="text-[20px] md:text-[30px] text-center  font-semibold text-white mb-2">
                  {getTranslation("product.description", "Description")}
                </h3>
                <p className="text-[18px] md:text-[20px]  leading-relaxed text-white  md:line-clamp-none">
                  {localizedDescription}
                </p>
              </div>
              <SimilarProducts
                currentProductId={id}
                category={product.category}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
