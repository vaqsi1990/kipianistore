"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getListFilterOptions } from "@/lib/actions/actions";
import { useRouter } from "@/i18n/navigation";

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  selectedCategories: string[];
  selectedBrands: string[];
  priceRange: { min: number; max: number };
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const t = useTranslations("filter");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [currentPriceRange, setCurrentPriceRange] = useState({ min: 0, max: 1000 });

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset sidebar state when component mounts
  useEffect(() => {
    setIsOpen(false);
    // Force cleanup
    document.body.style.overflow = 'auto';
  }, []);

  // Additional cleanup when component unmounts
  useEffect(() => {
    return () => {
      setIsOpen(false);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Manage body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Memoize categories and brands to prevent unnecessary re-renders
  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category))).filter(Boolean), 
    [products]
  );
  
  const brands = useMemo(() => 
    Array.from(new Set(products.map(p => p.brand))).filter(Boolean), 
    [products]
  );

  // Memoize localized category labels
  const getLocalizedCategoryLabel = useCallback((category: string) => {
    const map: Record<string, { en: string; ge: string }> = {
      
      'pillow': { en: 'Pillow', ge: 'ბალიში' },
      'mattress': { en: 'Mattress', ge: 'მატრასი' },
      'bed': { en: 'Bed', ge: 'საწოლი' },
      'quilt': { en: 'Quilt', ge: 'საბანი' },
      'OTHERS': { en: 'Others', ge: 'სხვა' }
    };
    const label = map[category] || { en: category, ge: category };
    return locale === "en" ? label.en : label.ge;
  }, [locale]);

  // Memoize text labels
  const labels = useMemo(() => ({
    filter: locale === "en" ? "Filter" : "ფილტრი",
    categories: locale === "en" ? "Categories" : "კატეგორიები",
    brands: locale === "en" ? "Brands" : "ბრენდები",
    priceRange: locale === "en" ? "Price Range" : "ფასის დიაპაზონი",
    clearFilters: locale === "en" ? "Clear Filters" : "ფილტრების გასუფთავება",
    search: locale === "en" ? "Search" : "ძიება",
    searchPlaceholder: locale === "en" ? "Search products..." : "პროდუქტების ძიება..."
  }), [locale]);

  // Calculate price range from products
  useEffect(() => {
    const fetch = async () => {
      try {
        const options = await getListFilterOptions();
        setProducts([
          ...options.categories.map((category) => ({ category, brand: "" })),
          ...options.brands.map((brand) => ({ category: "", brand })),
        ]);
        setPriceRange({ min: options.minPrice, max: options.maxPrice });
        setCurrentPriceRange({ min: options.minPrice, max: options.maxPrice });
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
      onFilterChange({ selectedCategories, selectedBrands, priceRange: currentPriceRange });
    }
  }, [selectedCategories, selectedBrands, currentPriceRange, onFilterChange, isMounted]);

  useEffect(() => {
    if (isMounted) {
      handleFilterChange();
    }
  }, [handleFilterChange, isMounted]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    setCurrentPriceRange(prev => ({ ...prev, [type]: value }));
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setCurrentPriceRange(priceRange);
    setSearchQuery("");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set('query', searchQuery.trim());
    }
    
    if (selectedCategories.length > 0) {
      // For multiple categories, join them with comma
      params.set('cat', selectedCategories.join(','));
    }
    
    if (selectedBrands.length > 0) {
      // For multiple brands, join them with comma
      params.set('brand', selectedBrands.join(','));
    }
    
    const url = `/list${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleToggle = () => setIsOpen(p => !p);
  const handleClose = () => {
    setIsOpen(false);
    // Ensure body scroll is restored
    document.body.style.overflow = 'auto';
  };

  // Show loading skeleton until mounted
  if (!isMounted) {
    return (
      <div className="mb-4 flex justify-start">
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#438c71] rounded-lg shadow-md">
          <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filter Toggle Button */}
      <div className="mb-4 pt-10 flex justify-start">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#438c71] rounded-lg shadow-md transition-colors hover:bg-[#3a7a5f] focus:outline-none focus:ring-2 focus:ring-[#438c71]/50"
        >
          <SlidersHorizontal size={18} />
          {labels.filter}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 top-20 bg-black/50 z-[1]"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed overflow-y-auto no-scrollbar top-20 left-0 h-[calc(100vh-80px)] w-3/4 sm:w-2/3 md:w-1/2 max-w-sm bg-white z-[2] shadow-lg transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {labels.filter}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
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
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {labels.search}
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={labels.searchPlaceholder}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#ce7c2a]"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {labels.categories}
                </h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="mr-3 rounded border-gray-300 text-[#ce7c2a] focus:border-[#ce7c2a]"
                      />
                      {getLocalizedCategoryLabel(category)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {labels.brands}
                  </h3>
                  <div className="space-y-2">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandChange(brand)}
                          className="mr-3 rounded uppercase border-gray-300 text-[#ce7c2a] focus:border-[#ce7c2a]"
                        />
                        {brand}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {labels.priceRange}
                </h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={currentPriceRange.min}
                    onChange={e => handlePriceChange("min", parseInt(e.target.value) || 0)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#ce7c2a]"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={currentPriceRange.max}
                    onChange={e => handlePriceChange("max", parseInt(e.target.value) || 0)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#ce7c2a]"
                    placeholder="Max"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  ₾{currentPriceRange.min} - ₾{currentPriceRange.max}
                </div>
              </div>

              {/* Search Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] focus:outline-none focus:border-[#438c71]/50"
                >
                  {labels.search}
                </button>
              </div>

              {/* Clear Button */}
              <div className="pt-2">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-[#ce7c2a] border border-[#ce7c2a] rounded-lg hover:bg-[#ce7c2a] hover:text-white transition-colors"
                >
                  {labels.clearFilters}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}