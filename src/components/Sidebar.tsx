import React, {
  useState,
  useEffect,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import { X, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getAllProducts } from "@/lib/actions/actions";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

interface SideBarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onFilterChange?: (filters: FilterState) => void;
  ref?: React.RefObject<{ clearFilters: () => void }>;
}

interface FilterState {
  selectedCategories: string[];
  selectedBrands: string[];
  priceRange: { min: number; max: number };
}

const SideBar: React.FC<SideBarProps> = ({
  isOpen,
  toggleSidebar,
  onFilterChange,
  ref,
}) => {
  const t = useTranslations("allPage.filters");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [currentPriceRange, setCurrentPriceRange] = useState({
    min: 0,
    max: 1000,
  });

  // Get URL parameters
  const urlCategory = searchParams.get("cat");
  const urlBrand = searchParams.get("brand");
  const urlQuery = searchParams.get("query");

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset sidebar state when component mounts
  useEffect(() => {
    // Force cleanup
    document.body.style.overflow = "auto";
  }, []);

  // Additional cleanup when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Manage body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Initialize selected categories and brands based on URL parameters
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategories([urlCategory]);
    }
    if (urlBrand) {
      setSelectedBrands([urlBrand]);
    }
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlCategory, urlBrand, urlQuery]);

  // Memoize categories and brands to prevent unnecessary re-renders
  const categories = useMemo(() => {
    let cats = Array.from(new Set(products.map((p) => p.category))).filter(
      Boolean
    );

    // Only filter by URL category if we're not clearing filters
    if (urlCategory && selectedCategories.length > 0) {
      cats = cats.filter(
        (cat) => cat.toLowerCase() === urlCategory.toLowerCase()
      );
    }

 
    return cats;
  }, [products, urlCategory, selectedCategories]);

  const brands = useMemo(() => {
    let brs = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

    // Only filter by URL brand if we're not clearing filters
    if (urlBrand && selectedBrands.length > 0) {
      brs = brs.filter(
        (brand) => brand.toLowerCase() === urlBrand.toLowerCase()
      );
    }

    return brs;
  }, [products, urlBrand, selectedBrands]);

  // Memoize localized category labels
  const getLocalizedCategoryLabel = useCallback(
    (category: string) => {
      const normalized = category.trim().toLowerCase();

      // Handle special case for "OTHERS" category
      if (normalized === 'others') {
        return t("others");
      }

      const map: Record<string, { en: string; ge: string }> = {
    
        pillow: { en: "Pillow", ge: "ბალიში" },
        mattress: { en: "Mattress", ge: "მატრასი" },
        bed: { en: "Bed", ge: "საწოლი" },
        quilt: { en: "Quilt", ge: "საბანი" },
      };

      const label = map[normalized] || { en: category, ge: category };
      return locale === "en" ? label.en : label.ge;
    },
    [locale, t]
  );

  // Memoize text labels
  const labels = useMemo(
    () => ({
      filter: t("title"),
      categories: t("categories.title"),
      brands: t("brand.title"),
      priceRange: t("priceRange.title"),
      clearFilters: t("clearFilters"),
      search: t("search"),
      searchPlaceholder: t("searchPlaceholder"),
    }),
    [t]
  );

  // Calculate price range from products
  useEffect(() => {
    const fetch = async () => {
      try {
        const { products } = await getAllProducts();
        setProducts(products);

        const prices = products
          .flatMap(
            (product: any) =>
              product.sizes?.map((s: any) => parseFloat(s.price)) || [
                parseFloat(product.price),
              ]
          )
          .filter((p: number) => !isNaN(p));

        if (prices.length > 0) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setPriceRange({ min, max });
          setCurrentPriceRange({ min, max });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isMounted) {
      fetch();
    }
  }, [isMounted]);

  // Apply filters when they change
  const handleFilterChange = useCallback(() => {
    if (onFilterChange && isMounted) {
      onFilterChange({
        selectedCategories,
        selectedBrands,
        priceRange: currentPriceRange,
      });
    }
  }, [
    selectedCategories,
    selectedBrands,
    currentPriceRange,
    onFilterChange,
    isMounted,
  ]);

  useEffect(() => {
    if (isMounted) {
      handleFilterChange();
    }
  }, [handleFilterChange, isMounted]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handlePriceChange = (type: "min" | "max", value: number) => {
    setCurrentPriceRange((prev) => ({ ...prev, [type]: value }));
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setCurrentPriceRange(priceRange);
    setSearchQuery("");
  
    // უბრალოდ ამოიღე router.replace(url)
    // ან თუ გინდა URL-საც გაასუფთავებ, მაგრამ გვერდის რეფრეშის გარეშე — გამოიყენე pushState ან router.replace მხოლოდ query update-ით.
  
    // Notify parent about cleared filters
    if (onFilterChange && isMounted) {
      onFilterChange({
        selectedCategories: [],
        selectedBrands: [],
        priceRange: priceRange,
      });
    }
  };
  
  
  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("query", searchQuery.trim());
    }

    if (selectedCategories.length > 0) {
      params.set("cat", selectedCategories.join(","));
    }

    if (selectedBrands.length > 0) {
      params.set("brand", selectedBrands.join(","));
    }

    // Preserve existing URL parameters if they exist
    if (urlCategory && !selectedCategories.includes(urlCategory)) {
      params.set("cat", urlCategory);
    }
    if (urlBrand && !selectedBrands.includes(urlBrand)) {
      params.set("brand", urlBrand);
    }

    const url = `/list${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(url);
    toggleSidebar();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClose = () => {
    toggleSidebar();
    // Ensure body scroll is restored
    document.body.style.overflow = "auto";
  };
  useImperativeHandle(ref, () => ({
    clearFilters,
  }));
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed  inset-0 top-0 bg-black/50 z-[1]"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed mt-14  pb-10 overflow-y-auto scrollbar-hidden top-0 left-0 h-screen w-60 md:w-80 bg-white shadow-lg transform transition-transform duration-300 z-30 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex  justify-between items-center p-4 border-b mt-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {labels.filter}
            </h2>
            {(selectedCategories.length > 0 ||
              selectedBrands.length > 0 ||
              currentPriceRange.min !== priceRange.min ||
              currentPriceRange.max !== priceRange.max ||
              searchQuery.trim() ||
              urlCategory ||
              urlBrand ||
              urlQuery) && (
              <span className="px-2 py-1 text-xs bg-[#bbb272] text-white rounded-full">
                {selectedCategories.length +
                  selectedBrands.length +
                  (currentPriceRange.min !== priceRange.min ||
                  currentPriceRange.max !== priceRange.max
                    ? 1
                    : 0) +
                  (searchQuery.trim() ? 1 : 0) +
                  (urlCategory ? 1 : 0) +
                  (urlBrand ? 1 : 0) +
                  (urlQuery ? 1 : 0)}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex flex-col h-[calc(100vh-140px)]">
          <div className="flex-1 p-4 space-y-6 ">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-300 rounded w-3/4"></div>
                ))}
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div>
                  <h3
                    className={`text-[18px] font-semibold text-gray-700 mb-3 ${
                      searchQuery.trim() || urlQuery
                        ? "text-[#438c71]"
                        : "text-gray-700"
                    }`}
                  >
                    {labels.search}
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={labels.searchPlaceholder}
                      className="w-full px-4 py-2 pl-10 sm:pr-14 border-2 border-gray-200 rounded-lg text-gray-800 transition-all duration-300 placeholder-gray-400"
                    />
                    <Search className="absolute  md:left-3  top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3
                    className={`text-[18px] font-semibold text-gray-700 mb-3 ${
                      selectedCategories.length > 0 || urlCategory
                        ? "text-[#438c71]"
                        : "text-gray-700"
                    }`}
                  >
                    {labels.categories} ({categories.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <label
                          key={category}
                          className={`flex items-center text-[14px] cursor-pointer transition-colors ${
                            selectedCategories.includes(category)
                              ? "text-[#438c71] font-medium"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => handleCategoryChange(category)}
                            className="mr-3 rounded border-gray-300 text-[#ce7c2a] focus:border-[#ce7c2a]"
                          />
                          {getLocalizedCategoryLabel(category)}
                        </label>
                      ))
                    ) : (
                      <p className="text-[14px] text-gray-500 italic">
                        No categories found
                      </p>
                    )}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h3
                    className={`text-[18px] font-semibold text-gray-700 mb-3 ${
                      selectedBrands.length > 0 || urlBrand
                        ? "text-[#438c71]"
                        : "text-gray-700"
                    }`}
                  >
                    {labels.brands} ({brands.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {brands.length > 0 ? (
                      brands.map((brand) => (
                        <label
                          key={brand}
                          className={`flex items-center text-[14px] cursor-pointer transition-colors ${
                            selectedBrands.includes(brand)
                              ? "text-[#438c71] font-medium"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => handleBrandChange(brand)}
                            className="mr-3 rounded uppercase border-gray-300 text-[#ce7c2a] focus:border-[#ce7c2a]"
                          />
                          {brand}
                        </label>
                      ))
                    ) : (
                      <p className="text-[14px] text-gray-500 italic">
                        No brands found
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h3
                    className={`text-[18px] font-semibold mb-3 ${
                      currentPriceRange.min !== priceRange.min ||
                      currentPriceRange.max !== priceRange.max
                        ? "text-[#438c71]"
                        : "text-gray-700"
                    }`}
                  >
                    {labels.priceRange}
                  </h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={currentPriceRange.min}
                      onChange={(e) =>
                        handlePriceChange("min", parseInt(e.target.value) || 0)
                      }
                      className="w-1/2 px-3 py-2 border font-normal border-gray-300 rounded-md text-[14px] focus:outline-none focus:border-[#ce7c2a]"
                      placeholder="0"
                    />
                    <input
                      type="number"
                      min={priceRange.min}
                      max={priceRange.max}
                      value={currentPriceRange.max}
                      onChange={(e) =>
                        handlePriceChange("max", parseInt(e.target.value) || 0)
                      }
                      className="w-1/2 px-3 py-2 border font-normal border-gray-300 rounded-md text-[14px] focus:outline-none focus:border-[#ce7c2a]"
                      placeholder="0"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    ₾{currentPriceRange.min} - ₾{currentPriceRange.max}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fixed Bottom Buttons */}
          <div className="p-4 border-t bg-white">
            {/* Search Button */}
            <button
              onClick={handleSearch}
             className="bg-[#bbb272] md:text-[20px] font-bold text-[18px] w-full border-radius:20px  px-4 sm:px-6 md:px-8 py-2 text-black  rounded-xl   transition-all duration-300 transform shadow-lg "
            >
              {labels.search}
            </button>

              <button
                onClick={clearFilters}
              className="w-full text-[16px] md:text-[18px] border-radius:20px text-[18px] bg-[#bbb272] text-white py-2 px-4 rounded-xl  transition-colors text-white font-bold"
              >
                {labels.clearFilters}
              </button>
       
       
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBar;
