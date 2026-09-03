"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getAllProducts, getListFilterOptions } from "@/lib/actions/actions";
import ProductHelper from "@/components/ProductHelper";
import { useLocale, useTranslations } from "next-intl";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { getStoreLabel } from "@/lib/store-utils";

const STORE_COOKIE = "selectedStore";

function readStoreCookie(): string {
  if (typeof document === "undefined") return "all";
  const match = document.cookie.match(new RegExp(`(?:^|; )${STORE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "all";
}

function writeStoreCookie(slug: string) {
  document.cookie = `${STORE_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event("store-changed"));
}

const CATEGORY_LABELS: Record<string, { en: string; ka: string }> = {
  MATTRESS: { en: "Mattress", ka: "მატრასი" },
  PILLOW: { en: "Pillow", ka: "ბალიში" },
  QUILT: { en: "Quilt", ka: "საბანი" },
  PAD: { en: "Topper", ka: "ტოპერი" },
  BED: { en: "Bed", ka: "საწოლი" },
  LINEN: { en: "Bedding & linen", ka: "თეთრეული" },
  PROTECTOR: { en: "Protectors", ka: "დამცავები" },
  OTHERS: { en: "Others", ka: "სხვა" },
};

export default function ListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [products, setProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    brands: string[];
    stores: { slug: string; nameKa: string; nameEn: string; address: string }[];
    minPrice: number;
    maxPrice: number;
  }>({ categories: [], brands: [], stores: [], minPrice: 0, maxPrice: 0 });
  const selectedType = (searchParams.get("cat") || "").split(",")[0].trim().toUpperCase();
  const selectedBrandRaw = (searchParams.get("brand") || "").split(",")[0].trim();
  const [itemsPerPage] = useState(20);
  const [priceDraft, setPriceDraft] = useState<{
    min: number | null;
    max: number | null;
  }>({ min: null, max: null });
  const sortBy = searchParams.get("sort") || "newest";
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [cookieStore, setCookieStore] = useState("all");
  const t = useTranslations("common");
  const selectedBrand =
    filterOptions.brands.find(
      (brand) => brand.toLowerCase() === selectedBrandRaw.toLowerCase()
    ) || selectedBrandRaw;
  const selectedStore = searchParams.get("store") || cookieStore;

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.set("page", "1");
    const query = params.toString();
    router.push(query ? `/list?${query}` : "/list");
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await getListFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error("Error loading FINA filter options:", error);
      }
    };
    loadOptions();
    setCookieStore(readStoreCookie());
  }, []);

  useEffect(() => {
    setPriceDraft({
      min: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : null,
      max: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : null,
    });
  }, [searchParams]);

  // წამოღება products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const pageFromUrl = Number(searchParams.get("page")) || 1;

        const filters = {
          category: searchParams.get("cat") || undefined,
          brands: searchParams.get("brand")
            ? searchParams.get("brand")!.split(",")
            : undefined,
          minPrice: searchParams.get("minPrice")
            ? Number(searchParams.get("minPrice"))
            : undefined,
          maxPrice: searchParams.get("maxPrice")
            ? Number(searchParams.get("maxPrice"))
            : undefined,
          inStock:
            searchParams.get("inStock") === "true"
              ? true
              : searchParams.get("inStock") === "false"
                ? false
                : undefined,
          query: searchParams.get("query") || undefined,
          sortBy: searchParams.get("sort") || "newest",
          storeSlug: searchParams.get("store") || undefined,
        };

        const res = await getAllProducts(pageFromUrl, itemsPerPage, false, filters);
        setProducts(res.products || []);
        setTotalProducts(res.total || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, itemsPerPage]);

  const getPageTitle = () => {
    const query = searchParams.get("query");
    const category = searchParams.get("cat");
    const brand = searchParams.get("brand");

    if (query) return `Search: ${query}`;
    if (category) {
      const key = category.split(",")[0].trim().toUpperCase();
      const labels = CATEGORY_LABELS[key];
      return labels ? (locale === "en" ? labels.en : labels.ka) : category;
    }
    if (brand) return brand;
    return t("products");
  };

  const transformedProducts = products.map((product) => {
      const currentPrice = product.price || product.minSizePrice || 0;
      const strikethrough =
        product.originalPrice && product.originalPrice > currentPrice
          ? product.originalPrice
          : undefined;

      return {
        id: product.id,
        image: product.images || [product.image] || ["/mattress.jpg"],
        price: currentPrice,
        originalPrice: strikethrough,
        sales: strikethrough ? product.sales : undefined,
        title: product.title || product.name,
        titleEn: product.titleEn,
        category: product.category,
        brand: product.brand,
      };
    });
  const clearFilters = () => {
    setIsMobileFilterOpen(false);
    writeStoreCookie("all");
    setCookieStore("all");
    router.push("/list");
  };

  const applyPriceFilter = () => {
    updateFilters({
      minPrice: priceDraft.min != null ? String(priceDraft.min) : null,
      maxPrice: priceDraft.max != null ? String(priceDraft.max) : null,
    });
    setIsMobileFilterOpen(false);
  };

  const handleLocationChange = (slug: string) => {
    const next = slug || "all";
    writeStoreCookie(next);
    setCookieStore(next);
    updateFilters({ store: next === "all" ? null : next });
  };

  const categoryLabel = (category: string) => {
    const labels = CATEGORY_LABELS[category];
    if (!labels) return category;
    return locale === "en" ? labels.en : labels.ka;
  };

  const hasActiveFilters = Boolean(
    searchParams.get("cat") ||
      searchParams.get("brand") ||
      searchParams.get("query") ||
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice") ||
      (selectedStore && selectedStore !== "all")
  );

  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const currentProducts = transformedProducts;

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("category")}</label>
        <select
          value={selectedType}
          onChange={(e) => updateFilters({ cat: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
        >
          <option value="">{t("allCategories")}</option>
          {filterOptions.categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("location")}</label>
        <select
          value={selectedStore}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
        >
          <option value="all">{t("allLocations")}</option>
          {filterOptions.stores.map((store) => (
            <option key={store.slug} value={store.slug}>
              {getStoreLabel(store, locale)}
              {store.address ? ` — ${store.address}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("brand")}</label>
        <select
          value={selectedBrand}
          onChange={(e) => updateFilters({ brand: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
        >
          <option value="">{t("allBrands")}</option>
          {filterOptions.brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("priceRange")}</label>
        <div className="space-y-2">
          <input
            type="number"
            placeholder={t("minPrice")}
            value={priceDraft.min ?? ""}
            onChange={(e) =>
              setPriceDraft((prev) => ({
                ...prev,
                min: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
          />
          <input
            type="number"
            placeholder={t("maxPrice")}
            value={priceDraft.max ?? ""}
            onChange={(e) =>
              setPriceDraft((prev) => ({
                ...prev,
                max: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <Button
          onClick={applyPriceFilter}
          className="w-full bg-[#869dab] text-[16px] md:text-[18px] text-white font-medium py-2 px-4 rounded-xl transition-colors"
        >
          {t("filter")}
        </Button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full border border-[#2E3A47] text-[16px] md:text-[18px] text-[#2E3A47] font-medium py-2 px-4 rounded-xl transition-colors"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <div className="relative flex items-center justify-center bg-overlay p-14 sm:p-16 overflow-hidden">
          <Image
            src="/bed.jpg"
            alt="Background"
            fill
            quality={80}
            className="object-cover z-0"
          />
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div className="relative z-20 text-center w-full">
            <h2 className="text-primary text-xl md:text-[40px] font-normal capitalize">
              {getPageTitle()}
            </h2>
          </div>
        </div>
        <div className="container min-h-screen mt-[50px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-[#e6dfd9] rounded-lg h-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#e6dfd9] rounded"></div>
                  <div className="h-4 bg-[#e6dfd9] rounded w-3/4"></div>
                  <div className="h-6 bg-[#e6dfd9] rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* header */}
      <div className="relative min-h-[50vh] flex items-center justify-center bg-overlay p-14 sm:p-16 overflow-hidden">
        <Image
          src="/bed.jpg"
          alt="Background"
          fill
          quality={80}
          className="object-cover z-0"
        />
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 text-center w-full">
          <h2 className="text-primary text-xl md:text-[45px] font-normal capitalize">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* content */}
      <div className="container min-h-screen mt-[50px]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-[#bbb272] rounded-full"></div>
              <p className="text-gray-600 text-[18px]">
                {t("found")}{" "}
                <span className="font-bold text-gray-900 text-[18px]">
                  {totalProducts}
                </span>{" "}
                {t("products")}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <label className="text-[18px] font-medium text-gray-700">
                {t("sortBy")}
              </label>
              <select
                value={sortBy}
                onChange={(e) => updateFilters({ sort: e.target.value === "newest" ? null : e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50"
              >
                <option value="newest">{t("newest")}</option>
                <option value="price-low">{t("priceLowToHigh")}</option>
                <option value="price-high">{t("priceHighToLow")}</option>
                <option value="name">{t("nameAZ")}</option>
              </select>
              {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    className="bg-[#bbb272] text-white px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t("clearFilters")}
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full bg-[#bbb272] text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Filter className="w-5 h-5" />
            {t("filter")}
          </button>
        </div>

        <div className="flex flex-col mb-14 lg:flex-row gap-8">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-[20px] font-semibold text-black mb-4">{t("filter")}</h3>
              <FilterContent />
            </div>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {currentProducts.length > 0 ? (
              <>
                <ProductHelper items={currentProducts} sliderId="list" />

                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <Pagination
                      pageCount={totalPages}
                    />
                  </div>
                )}

              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No products found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          
          {/* Filter Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-[70%] max-w-sm bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center  mt-20 justify-between p-4 border-b border-gray-200 ">
              <h3 className="text-lg font-semibold text-black">
                {t("filter")}
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Filter Content */}
            <div className="p-4 overflow-y-auto h-full pb-24">
              <FilterContent />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
