"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EditProductForm from "@/components/EditProductForm";
import {
  getFinaProductForEdit,
  searchFinaProducts,
  type FinaProductEditData,
  type FinaProductSearchHit,
} from "@/lib/actions/fina-product.actions";

export default function ProductForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FinaProductSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FinaProductEditData | null>(null);

  const runSearch = async (value = query) => {
    setSearching(true);
    setError(null);
    try {
      const hits = await searchFinaProducts(value);
      setResults(hits);
    } catch (err) {
      console.error(err);
      setError("FINA პროდუქტების ძებნა ვერ მოხერხდა");
    } finally {
      setSearching(false);
    }
  };

  const selectProduct = async (id: string) => {
    setLoadingProduct(true);
    setError(null);
    try {
      const product = await getFinaProductForEdit(id);
      if (!product) {
        setError("ეს FINA პროდუქტი ვერ მოიძებნა");
        return;
      }
      setSelected(product);
    } catch (err) {
      console.error(err);
      setError("პროდუქტის ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoadingProduct(false);
    }
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSelected(null)}
          className="rounded-lg"
        >
          სხვა FINA პროდუქტის არჩევა
        </Button>
        <EditProductForm product={selected} mode="create" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          პროდუქტის დამატება
        </h1>
        <p className="text-gray-600">
          აირჩიეთ პროდუქტი FINA კატალოგიდან და დაამატეთ სურათები საიტისთვის.
          ახალი პროდუქტი იქმნება FINA-ში, აქ მხოლოდ საიტის მონაცემები ინახება.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch();
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ძებნა სახელით ან FINA კოდით..."
          className="h-11 border-2"
        />
        <Button
          type="submit"
          disabled={searching}
          className="px-6 py-2 font-bold text-white bg-[#438c71] rounded-lg"
        >
          {searching ? "იძებნება..." : "ძებნა"}
        </Button>
      </form>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void runSearch("")}
          className="text-sm text-[#438c71] hover:underline"
        >
          ბოლო პროდუქტების ჩვენება
        </button>
      </div>

      {loadingProduct && (
        <p className="text-sm text-gray-500">პროდუქტი იტვირთება...</p>
      )}

      {results.length > 0 && (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => void selectProduct(product.id)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-sm text-gray-500">{product.titleEn}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    კოდი: {product.code} · {product.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">₾{product.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {product.inStock ? "მარაგშია" : "მარაგი 0"}
                  </p>
                  {product.hasCustomImages && (
                    <p className="text-xs text-[#438c71]">სურათი უკვე აქვს</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
