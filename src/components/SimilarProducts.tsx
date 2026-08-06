"use client";
import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { getSimilarProducts } from "@/lib/actions/actions";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import ProductHelper from "@/components/ProductHelper";
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
}

interface SimilarProductsProps {
  currentProductId: string;
  category: string;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({
  currentProductId,
  category,
}) => {
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("productDetail");
  const locale = useLocale();

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);
        const data = await getSimilarProducts(currentProductId, category, 4);
        // The data is already converted to numbers by the server action
        const productsWithPrices = data.map((product: any) => ({
          ...product,
          sizes: product.sizes || [],
          sales: product.sales || undefined,
        }));
        setSimilarProducts(productsWithPrices as Product[]);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [currentProductId, category]);

  const getProductPriceRange = (product: Product) => {
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
  };

  const getLocalizedTitle = (product: Product): string => {
    if (locale === "en") {
      return product.titleEn ?? product.title;
    }
    return product.title ?? product.titleEn ?? "";
  };

  const getTranslation = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation || fallback;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return fallback;
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto">
       
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-[#e6dfd9] rounded-lg h-48 mb-3"></div>
                <div className="bg-[#e6dfd9] h-4 rounded mb-2"></div>
                <div className="bg-[#e6dfd9] h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (similarProducts.length === 0) {
    return (
      <div className="mt-20">
        <div className="container mx-auto px-4">
          <h2 className="text-[45px] font-bold text-white mb-6 text-center">
            {getTranslation("similarProducts.title", "Similar Products")}
          </h2>
          <div className="text-center py-8">
            <div className="text-white text-lg mb-2">
              {getTranslation(
                "similarProducts.noProducts",
                "No similar products found"
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8  mx-auto">
      <div className="text-center">
          <h2 className="text-[20px] md:text-[30px] font-bold text-white mb-6">
            {getTranslation("similarProducts.title", "Similar Products")}
          </h2>
      </div>

      <div className="flex justify-center ">
        <div className="w-full   px-4">
          <ProductHelper
            items={similarProducts.slice(0, 4).map((product) => ({
              id: product.id,
              image: product.images,
              price: product.price
                ? product.price
                : product.sizes?.[0]?.price || 0,
              originalPrice: undefined,
              sales: product.sales,
              title: product.title,
              titleEn: product.titleEn,
            }))}
            sliderId={`similar-products-${currentProductId}`}
          />
        </div>
      </div>
    </div>
  );
};
export default SimilarProducts;
