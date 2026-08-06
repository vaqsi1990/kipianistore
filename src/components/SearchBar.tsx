"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

function SearchHelper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("search");

  const [query, setQuery] = useState("");

  const [isSearching, setIsSearching] = useState(false);

  // Sync local state with URL query
  useEffect(() => {
    const currentQuery = searchParams.get("query") || "";
    setQuery(currentQuery);
  }, [searchParams]);

  const handleSearch = (term: string) => {
    setIsSearching(true);
    const params = new URLSearchParams(searchParams.toString());

    if (term.trim()) {
      params.set("query", term.trim());
    } else {
      params.delete("query");
    }

    // Always reset page
    params.set("page", "1");

    // Use the current locale
    const newPath = `/list`;
    const newUrl = `${newPath}?${params.toString()}`;

    router.push(newUrl);

    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const clearSearch = () => {
    setQuery("");
    handleSearch("");
  };

  return (
    <div className="relative inline-block h-[40px] w-full max-w-xs">
      <div className="inline-flex items-center gap-2 h-[40px] w-full px-4 py-2 rounded-full bg-white/70 backdrop-blur-md text-black font-semibold">
        <div
          className="w-5 h-5 text-gray-500 flex items-center justify-center cursor-pointer hover:text-gray-700 transition-colors"
          onClick={() => handleSearch(query)}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
          }}
          type="text"
          placeholder={t("placeholder") || "Search products..."}
          className="flex-1 bg-transparent placeholder:text-[16px] outline-none border-none text-sm text-black placeholder-black font-normal"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="text-white hover:text-[#438c71] transition-colors duration-200 rounded-full"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchHelper;
