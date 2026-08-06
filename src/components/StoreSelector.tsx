"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";
import { getActiveStores } from "@/lib/actions/store.actions";
import { getStoreLabel } from "@/lib/store-utils";

type Store = {
  id: string;
  slug: string;
  nameKa: string;
  nameEn: string;
};

const STORE_COOKIE = "selectedStore";

function readStoreCookie(): string {
  if (typeof document === "undefined") return "all";
  const match = document.cookie.match(new RegExp(`(?:^|; )${STORE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "all";
}

function writeStoreCookie(slug: string) {
  document.cookie = `${STORE_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function StoreSelector() {
  const locale = useLocale();
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState("all");

  useEffect(() => {
    setSelected(readStoreCookie());
    getActiveStores().then(setStores);
  }, []);

  const handleChange = (slug: string) => {
    setSelected(slug);
    writeStoreCookie(slug);
    window.location.reload();
  };

  if (!stores.length) return null;

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 shrink-0" />
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
        aria-label="Select store city"
      >
        <option value="all">{locale === "en" ? "All cities" : "ყველა ქალაქი"}</option>
        {stores.map((store) => (
          <option key={store.id} value={store.slug}>
            {getStoreLabel(store, locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
