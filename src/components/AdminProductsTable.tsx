"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaEye, FaPen, FaPlus, FaSearch } from "react-icons/fa";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminProductRow = {
  id: string;
  code?: string;
  title: string;
  titleEn: string;
  category: string;
  images: string[];
  brand: string;
  price?: number;
  originalPrice?: number;
  sales?: number;
  popular: boolean;
  inStock: boolean;
  tbilisi: boolean;
  batumi: boolean;
  batumi44: boolean;
  qutaisi: boolean;
  kobuleti: boolean;
  zugdidi: boolean;
};

const PAGE_SIZE = 10;

function pageNumbers(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}

export default function AdminProductsTable({
  products,
}: {
  products: AdminProductRow[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = !q
      ? products
      : products.filter((product) => {
          const title = product.title?.toLowerCase() || "";
          const titleEn = product.titleEn?.toLowerCase() || "";
          const code = product.code?.toLowerCase() || "";
          const brand = product.brand?.toLowerCase() || "";
          return (
            title.includes(q) ||
            titleEn.includes(q) ||
            code.includes(q) ||
            brand.includes(q)
          );
        });

    return [...matched].sort((a, b) => Number(b.inStock) - Number(a.inStock));
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const pages = pageNumbers(currentPage, totalPages);

  function handleSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FaPlus className="text-gray-400 text-2xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">პროდუქტები არ არის</h3>
        <p className="text-gray-500 mb-6">დაამატეთ პირველი პროდუქტი</p>
        <Link href="/new">
          <Button
            className="px-4 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors"
            variant="default"
          >
            <FaPlus className="mr-2" />
            პროდუქტის დამატება
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ძებნა სახელით, კოდით ან ბრენდით..."
            className="pl-10 h-11 border-2 border-gray-200 rounded-lg"
          />
        </div>
        <p className="text-sm text-gray-600 whitespace-nowrap">
          {filtered.length === 0
            ? "0 პროდუქტი"
            : `${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} / ${filtered.length}`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">ვერ მოიძებნა</h3>
          <p className="text-gray-500">შეცვალეთ საძიებო სიტყვა</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-white">
                  <th className="text-left p-4 font-semibold">პროდუქტი</th>
                  <th className="text-left p-4 font-semibold">კოდი</th>
                  <th className="text-left p-4 font-semibold">კატეგორია</th>
                  <th className="text-left p-4 font-semibold">ბრენდი</th>
                  <th className="text-left p-4 font-semibold">ფასი</th>
                  <th className="text-left p-4 font-semibold">გაყიდვები</th>
                  <th className="text-left p-4 font-semibold">სტატუსი</th>
                  <th className="text-left p-4 font-semibold">ქონება</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="border-b bg-white">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {product.images && product.images.length > 0 && (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-gray-500">{product.titleEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-sm">{product.code || "—"}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{product.brand}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        ₾{Number(product.price || 0).toFixed(2)}
                        {product.originalPrice &&
                        product.originalPrice > Number(product.price || 0) ? (
                          <span className="ml-2 line-through text-gray-400">
                            ₾{Number(product.originalPrice).toFixed(2)}
                          </span>
                        ) : null}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{product.sales || 0}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {product.popular && (
                          <Badge variant="default" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        <div className="flex gap-1 flex-wrap">
                          {product.tbilisi && (
                            <Badge variant="secondary" className="text-xs">
                              თბილისი
                            </Badge>
                          )}
                          {product.batumi && (
                            <Badge variant="secondary" className="text-xs">
                              ბათუმი
                            </Badge>
                          )}
                          {product.batumi44 && (
                            <Badge variant="secondary" className="text-xs">
                              ბათუმი 44
                            </Badge>
                          )}
                          {product.qutaisi && (
                            <Badge variant="secondary" className="text-xs">
                              ქუთაისი
                            </Badge>
                          )}
                          {product.kobuleti && (
                            <Badge variant="secondary" className="text-xs">
                              ქობულეთი
                            </Badge>
                          )}
                          {product.zugdidi && (
                            <Badge variant="secondary" className="text-xs">
                              ზუგდიდი
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${product.id}`}>
                          <Button
                            className="px-3 py-2 font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors"
                            size="sm"
                            variant="outline"
                          >
                            <FaEye className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Link href={`/edit?id=${product.id}`}>
                          <Button
                            className="px-3 py-2 font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
                            size="sm"
                            variant="outline"
                          >
                            <FaPen className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg"
              >
                <FaChevronLeft className="w-3 h-3" />
              </Button>
              {pages.map((pageNum, index) => {
                const prev = pages[index - 1];
                return (
                  <span key={pageNum} className="flex items-center gap-2">
                    {prev && pageNum - prev > 1 && (
                      <span className="px-1 text-gray-400">…</span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant={pageNum === currentPage ? "default" : "outline"}
                      onClick={() => setPage(pageNum)}
                      className="min-w-9 rounded-lg"
                    >
                      {pageNum}
                    </Button>
                  </span>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg"
              >
                <FaChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
