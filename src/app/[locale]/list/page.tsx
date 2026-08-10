"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getAllProducts } from "@/lib/actions/actions";
import ProductHelper from "@/components/ProductHelper";
import { useTranslations } from "next-intl";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { motion } from "framer-motion";

export default function ListPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedPrice, setSelectedPrice] = useState<{
    min: number | null;
    max: number | null;
  }>({ min: null, max: null });
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const t = useTranslations("common");

  // Initialize current page from URL and reset pagination when filters or sorting change
  useEffect(() => {
    const pageFromUrl = searchParams.get("page");
    if (pageFromUrl) {
      setCurrentPage(Number(pageFromUrl));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams, sortBy]);

  // წამოღება products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const pageFromUrl = Number(searchParams.get("page")) || 1;
        setCurrentPage(pageFromUrl);

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
    if (category) return category;
    if (brand) return brand;
    return t("products");
  };
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (selectedType && product.category !== selectedType) {
      return false;
    }

    // Brand filter
    if (selectedBrand && product.brand !== selectedBrand) {
      return false;
    }

    // Price filter
    const productPrice = product.price || product.minSizePrice || 0;
    if (selectedPrice.min !== null && productPrice < selectedPrice.min) {
      return false;
    }
    if (selectedPrice.max !== null && productPrice > selectedPrice.max) {
      return false;
    }

    return true;
  });
  // sorting
  const transformedProducts = filteredProducts
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (
            (a.price || a.minSizePrice || 0) -
            (b.price || b.minSizePrice || 0)
          );
        case "price-high":
          return (
            (b.price || b.minSizePrice || 0) -
            (a.price || a.minSizePrice || 0)
          );
        case "name":
          return (a.title || a.name || "").localeCompare(
            b.title || b.name || ""
          );
        default:
          return 0;
      }
    })
    .map((product) => ({
      id: product.id,
      image: product.images || [product.image],
      price: product.price || product.minSizePrice || 0,
      title: product.title || product.name,
      category: product.category,
      brand: product.brand,
    }));
  // Clear all filters
  const clearFilters = () => {
    setSelectedType("");
    setSelectedBrand("");
    setSelectedPrice({ min: null, max: null });
    setSortBy("newest");
    setCurrentPage(1);
    // Close mobile filter after clearing
    setIsMobileFilterOpen(false);
  };
  // pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const currentProducts = transformedProducts;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL with page parameter
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter component to avoid duplication
  const FilterContent = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("category")}</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
        >
          <option value="">{t("allCategories")}</option>
          {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Brand Filter */}
      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("brand")}</label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
        >
          <option value="">{t("allBrands")}</option>
          {Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-[16px] md:text-[18px] font-medium text-black mb-2">{t("priceRange")}</label>
        <div className="space-y-2">
          <input
            type="number"
            placeholder={t("minPrice")}
            value={selectedPrice.min || ''}
            onChange={(e) => setSelectedPrice(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : null }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
          />
          <input
            type="number"
            placeholder={t("maxPrice")}
            value={selectedPrice.max || ''}
            onChange={(e) => setSelectedPrice(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : null }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#438c71]/50 focus:border-[#438c71]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={() => setIsMobileFilterOpen(false)}
          className="w-full bg-[#869dab] text-[16px] md:text-[18px] text-white font-medium py-2 px-4 rounded-xl transition-colors"
        >
          ფილტრი
        </Button>
        {(!searchParams.get("cat") && !searchParams.get("brand") && !searchParams.get("query")) && (
          <button
            onClick={clearFilters}
            className="w-full border border-[#2E3A47] text-[16px] md:text-[18px] text-[#2E3A47] font-medium py-2 px-4 rounded-xl transition-colors"
          >
           გასუფთავება
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
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50"
              >
                <option value="newest">{t("newest")}</option>
                <option value="price-low">{t("priceLowToHigh")}</option>
                <option value="price-high">{t("priceHighToLow")}</option>
                <option value="name">{t("nameAZ")}</option>
              </select>
              {(searchParams.get("cat") ||
                searchParams.get("brand") ||
                searchParams.get("query")) && (
                  <Button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.search = "";
                      window.location.href = url.toString();
                    }}
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
