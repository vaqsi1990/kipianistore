"use client";

import { Link } from "@/i18n/navigation";
import React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Button } from "./ui/button";

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
  items: ProductItem[];
  sliderId: string;
}

const FALLBACK_IMAGE = "/mattress.jpg";

const getLocalizedTitle = (product: ProductItem, locale: string): string => {
  if (locale === "en") {
    return product.titleEn ?? product.title;
  }
  return product.title ?? product.titleEn ?? "";
};

function ProductCard({
  item,
  locale,
  detailsLabel,
  imageSizes,
}: {
  item: ProductItem;
  locale: string;
  detailsLabel: string;
  imageSizes: string;
}) {
  const title = getLocalizedTitle(item, locale);
  const imageSrc = item.image?.[0] || FALLBACK_IMAGE;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <Link href={`/products/${item.id}`}>
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes={imageSizes}
            className="object-cover"
            loading="lazy"
            quality={75}
          />
          {item.sales && item.sales > 0 && (
            <span className="absolute top-2 right-2 text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full">
              -{item.sales}%
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link
            href={`/products/${item.id}`}
            className="hover:text-[#bbb272] transition-colors"
          >
            {title}
          </Link>
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[16px] font-bold text-black">
            ₾{Number(item.price || 0).toFixed(2)}
          </span>
          {item.originalPrice ? (
            <span className="text-sm line-through text-gray-400">
              ₾{item.originalPrice.toFixed(2)}
            </span>
          ) : null}
        </div>
        <Button asChild className="w-full mt-auto bg-[#bbb272] text-white shadow-[#bbb272]/25 hover:shadow-xl">
          <Link href={`/products/${item.id}`}>{detailsLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

function ProductHelper({ items, sliderId }: ProductListProps) {
  const locale = useLocale();
  const t = useTranslations("helper");

  if (!items || items.length === 0) {
    return null;
  }

  const nextClass = `swiper-button-next-mobile-${sliderId}`;
  const prevClass = `swiper-button-prev-mobile-${sliderId}`;
  const detailsLabel = t("details");

  return (
    <>
      <div className="hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              locale={locale}
              detailsLabel={detailsLabel}
              imageSizes="(max-width: 768px) 100vw, 20vw"
            />
          ))}
        </div>
      </div>

      <div className="md:hidden relative">
        <div className="absolute top-[40%] left-0 z-10 -translate-y-1/2">
          <button
            className={`${prevClass} text-black bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow`}
          >
            ‹
          </button>
        </div>
        <div className="absolute top-[40%] right-0 z-10 -translate-y-1/2">
          <button
            className={`${nextClass} text-black bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow`}
          >
            ›
          </button>
        </div>

        <Swiper
          modules={[Navigation]}
          navigation={{
            nextEl: `.${nextClass}`,
            prevEl: `.${prevClass}`,
          }}
          slidesPerView={1}
          spaceBetween={16}
          className="pb-12"
        >
          {items.map((item) => (
            <SwiperSlide key={item.id}>
              <ProductCard
                item={item}
                locale={locale}
                detailsLabel={detailsLabel}
                imageSizes="100vw"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}

export default ProductHelper;
