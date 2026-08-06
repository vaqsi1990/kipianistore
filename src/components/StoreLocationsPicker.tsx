"use client";

import { useEffect, useState } from "react";
import { getActiveStores } from "@/lib/actions/store.actions";

export type StoreStockEntry = {
  storeId: string;
  stock: number;
};

type Store = {
  id: string;
  slug: string;
  nameKa: string;
  nameEn: string;
  address: string;
};

type StoreLocationsPickerProps = {
  value: StoreStockEntry[];
  onChange: (entries: StoreStockEntry[]) => void;
};

export default function StoreLocationsPicker({
  value,
  onChange,
}: StoreLocationsPickerProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveStores()
      .then(setStores)
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (storeId: string) =>
    value.some((entry) => entry.storeId === storeId);

  const getStock = (storeId: string) =>
    value.find((entry) => entry.storeId === storeId)?.stock ?? 1;

  const toggleStore = (storeId: string) => {
    if (isSelected(storeId)) {
      onChange(value.filter((entry) => entry.storeId !== storeId));
    } else {
      onChange([...value, { storeId, stock: 1 }]);
    }
  };

  const updateStock = (storeId: string, stock: number) => {
    onChange(
      value.map((entry) =>
        entry.storeId === storeId
          ? { ...entry, stock: Math.max(0, stock) }
          : entry
      )
    );
  };

  const selectAll = () =>
    onChange(stores.map((store) => ({ storeId: store.id, stock: 1 })));

  const clearAll = () => onChange([]);

  if (loading) {
    return <p className="text-sm text-gray-500">ფილიალები იტვირთება...</p>;
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">ხელმისაწვდომი ფილიალები და მარაგი</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-[#438c71] hover:underline"
          >
            ყველა
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-gray-500 hover:underline"
          >
            გასუფთავება
          </button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {stores.map((store) => {
          const selected = isSelected(store.id);
          return (
            <div
              key={store.id}
              className={`rounded-md border p-3 ${selected ? "border-[#438c71] bg-green-50/40" : ""}`}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleStore(store.id)}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block font-medium">{store.nameKa}</span>
                  <span className="block text-sm text-gray-500">
                    {store.address}
                  </span>
                </span>
              </label>
              {selected && (
                <div className="mt-2 flex items-center gap-2 pl-6">
                  <label className="text-sm text-gray-600">მარაგი:</label>
                  <input
                    type="number"
                    min={0}
                    value={getStock(store.id)}
                    onChange={(e) =>
                      updateStock(store.id, Number(e.target.value))
                    }
                    className="w-20 rounded border px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {value.length === 0 && (
        <p className="text-sm text-red-500">აირჩიეთ მინიმუმ ერთი ფილიალი</p>
      )}
    </div>
  );
}
