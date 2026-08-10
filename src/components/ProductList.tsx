/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import ProductHelper from "./ProductHelper";
import { useTranslations } from "next-intl";
import { getAllProducts } from "@/lib/actions/actions";
import { useParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

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
  size?: string;
  price?: number;
  sales?: number;
  minSizePrice?: number;
}

interface ProductItem {
  id: string;
  image: string[];
  price: number;
  originalPrice?: number;
  sales?: number;
  title: string;
  titleEn?: string;
}

interface ProductListProps {
  selectedType?: string;
  selectedBrand?: string;
  selectedPrice?: { min: number | null; max: number | null };
}

function ProductList({
  selectedType = "",
  selectedBrand = "",
  selectedPrice = { min: null, max: null },
}: ProductListProps) {
  const t = useTranslations("productList");
  const params = useParams();
  const locale = params.locale as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { products: fetchedProducts } = await getAllProducts(1, 60);
        setProducts(
          fetchedProducts.map((product: any) => ({
            ...product,
            price: product.price || undefined,
            minSizePrice: product.minSizePrice || undefined,
            sales: product.sales || undefined,
            sizes: product.sizes || [],
          })) as Product[]
        );
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getProductPriceRange = useCallback((product: Product) => {
    if (product.minSizePrice !== undefined) {
      return { min: product.minSizePrice, max: product.minSizePrice };
    }
    if (product.sizes && product.sizes.length > 0) {
      const prices = product.sizes.map((s) => s.price);
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    }
    if (product.price) {
      return { min: product.price, max: product.price };
    }
    return { min: 0, max: 0 };
  }, []);

  const getLocalizedTitle = useCallback(
    (product: Product): string => {
      if (locale === "en") {
        return product.titleEn ?? product.title;
      }
      return product.title ?? product.titleEn ?? "";
    },
    [locale]
  );

  const getFilteredProducts = useCallback(() => {
    return products.filter((product) => {
      const byLegacyType =
        !selectedType ||
        product.category.toLowerCase() === selectedType.toLowerCase();

      const byLegacyBrand =
        !selectedBrand ||
        (product.category === "OTHERS"
          ? true
          : product.brand === selectedBrand);

      const priceRange = getProductPriceRange(product);
      const byLegacyMinPrice =
        selectedPrice.min === null || priceRange.max >= selectedPrice.min;
      const byLegacyMaxPrice =
        selectedPrice.max === null || priceRange.min <= selectedPrice.max;

      return (
        byLegacyType &&
        byLegacyBrand &&
        byLegacyMinPrice &&
        byLegacyMaxPrice
      );
    });
  }, [
    products,
    selectedType,
    selectedBrand,
    selectedPrice,
    getProductPriceRange,
  ]);

  const filteredProducts = useMemo(() => {
    const filtered = getFilteredProducts();
    const mattresses = filtered.filter((p) => p.category === "MATTRESS");
    return mattresses.slice(0, 10); // Show first 10 mattress items
  }, [getFilteredProducts, products]);

  const filteredProducts2 = useMemo(() => {
    const popular = products.filter((p) => p.popular === true);
    return popular.slice(0, 10); // Show first 10 popular products
  }, [products]);

  const filteredProducts3 = useMemo(() => {
    const salesProducts = products.filter((p) => p.sales && p.sales > 0);
    return salesProducts.slice(0, 10); // Show first 10 sales products
  }, [products]);

  const transformProducts = useCallback(
    (products: Product[]) => {
      return products.map((product) => {
        const priceRange = getProductPriceRange(product);
        const originalPrice = priceRange.min;
        const salesPercentage = product.sales || 0;
        const discountedPrice =
          salesPercentage > 0
            ? originalPrice * (1 - salesPercentage / 100)
            : originalPrice;

        return {
          id: product.id,
          image: product.images,
          price: discountedPrice,
          originalPrice: salesPercentage > 0 ? originalPrice : undefined,
          sales: salesPercentage > 0 ? salesPercentage : undefined,
          title: getLocalizedTitle(product),
          titleEn: product.titleEn,
        };
      });
    },
    [getProductPriceRange, getLocalizedTitle]
  );

  const transformedProducts = useMemo(
    () => transformProducts(filteredProducts),
    [filteredProducts, transformProducts]
  );

  const transformedProducts2 = useMemo(
    () => transformProducts(filteredProducts2),
    [filteredProducts2, transformProducts]
  );

  const transformedProducts3 = useMemo(
    () => transformProducts(filteredProducts3),
    [filteredProducts3, transformProducts]
  );

  const tabs = [
    { id: "new", label: t("newProducts"), products: transformedProducts, count: transformedProducts.length },
    { id: "popular", label: t("popularProducts"), products: transformedProducts2, count: transformedProducts2.length },
    { id: "sales", label: t("salesProducts"), products: transformedProducts3, count: transformedProducts3.length },
  ];

  // Filter out empty tabs
  const visibleTabs = tabs.filter(tab => tab.count > 0);

  // Update activeTab if current tab is empty
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);


  // Don't render anything if no tabs have products
  if (visibleTabs.length === 0) {
    return (
      <section className="px-5 md:px-20 from-gray-50 via-white to-gray-50">
        <div className="container mx-auto">
          <div className="max-w-7xl pt-16 mb-14 mx-auto">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                პროდუქტი ვერ მოიძებნა
              </h3>
              <p className="text-white">
                ამ კატეგორიაში პროდუქტები არ არის
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 md:px-20 from-gray-50 via-white to-gray-50">
      <div className="container mx-auto">
        <div className="max-w-7xl pt-16 mb-14 mx-auto">
          {/* Tab Navigation */}
          <div className="hidden md:block">
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-2xl p-2 shadow-lg">
                <div className="flex space-x-2">
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-xl font-bold md:text-[20px] border-radius:20px text-[18px] transition-all font-bold duration-200 ${activeTab === tab.id
                        ? "bg-[#869dab] text-black shadow-md"
                        : "text-black "
                        }`}
                    >
                      {/* bg-[#f3983e] md:text-[20px] text-[18px] w-full border-radius:20px  px-4 sm:px-6 md:px-8 py-2 text-black  rounded-xl font-bold  transition-all duration-300 transform shadow-lg  */}
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 text-[16px] bg-white/20 px-4 py-3 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
          <div className="block md:hidden">
            <div className="flex justify-center mb-8 px-2">
              <div className="bg-white rounded-2xl p-2 shadow-lg w-full max-w-3xl">
                <div className="flex flex-wrap gap-2 justify-center">
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-xl font-bold md:text-[20px] border-radius:20px text-[18px] transition-all font-bold duration-200 ${activeTab === tab.id
                        ? "bg-[#bbb272] text-white shadow-md"
                        : "text-black "
                        }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 text-[16px] bg-white/20 px-4 py-3  rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Tab Content */}
                     {loading ? (
             // Skeleton Loading State
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="animate-pulse">
                    {/* Skeleton Image */}
                    <div className="w-full h-[192px] bg-white rounded-3xl mb-3"></div>
                    {/* Skeleton Title */}
                    <div className="w-[70%] h-4 bg-white rounded mb-2 mx-auto"></div>
                    {/* Skeleton Price */}
                    <div className="w-[40%] h-6 bg-white rounded mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full rounded-2xl pt-6">
              {visibleTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`transition-all duration-300 ${activeTab === tab.id ? "block opacity-100" : "hidden opacity-0"
                    }`}
                >
                  {tab.products.length > 0 ? (
                    <div className="mt-5">
                      <ProductHelper items={tab.products} sliderId={tab.id} />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg
                          className="w-16 h-16 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        პროდუქტი ვერ მოიძებნა
                      </h3>
                      <p className="text-gray-600">
                        ამ კატეგორიაში პროდუქტები არ არის
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductList;
