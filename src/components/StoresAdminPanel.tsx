"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createStore,
  updateStore,
  deleteStore,
} from "@/lib/actions/store.actions";
import { toast } from "sonner";

type StoreRow = {
  id: string;
  slug: string;
  nameKa: string;
  nameEn: string;
  address: string;
  city: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
};

type StoreForm = {
  slug: string;
  nameKa: string;
  nameEn: string;
  address: string;
  city: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: StoreForm = {
  slug: "",
  nameKa: "",
  nameEn: "",
  address: "",
  city: "",
  sortOrder: 0,
  isActive: true,
};

export default function StoresAdminPanel({
  initialStores,
}: {
  initialStores: StoreRow[];
}) {
  const [stores, setStores] = useState(initialStores);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (store: StoreRow) => {
    setEditingId(store.id);
    setForm({
      slug: store.slug,
      nameKa: store.nameKa,
      nameEn: store.nameEn,
      address: store.address,
      city: store.city,
      sortOrder: store.sortOrder,
      isActive: store.isActive,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = editingId
        ? await updateStore(editingId, form)
        : await createStore(form);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (editingId) {
        setStores((prev) =>
          prev.map((store) =>
            store.id === editingId ? { ...store, ...form } : store
          )
        );
      } else {
        window.location.reload();
      }

      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      toast.error("ფილიალს აქვს მიბმული პროდუქტები — ჯერ მოაშორეთ ისინი");
      return;
    }

    if (!confirm("ნამდვილად გსურთ ფილიალის წაშლა?")) return;

    const result = await deleteStore(id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setStores((prev) => prev.filter((store) => store.id !== id));
    toast.success(result.message);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "ფილიალის რედაქტირება" : "ახალი ფილიალი"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="slug (მაგ. rustavi)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <Input
              placeholder="სახელი (ქართ.)"
              value={form.nameKa}
              onChange={(e) => setForm({ ...form, nameKa: e.target.value })}
              required
            />
            <Input
              placeholder="Name (English)"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              required
            />
            <Input
              placeholder="მისამართი"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
            <Input
              placeholder="ქალაქი"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder="რიგი"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              აქტიური
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "..." : editingId ? "განახლება" : "დამატება"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  გაუქმება
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ფილიალების სია ({stores.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {store.nameKa}{" "}
                    {!store.isActive && (
                      <span className="text-xs text-gray-500">(არააქტიური)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">{store.address}</p>
                  <p className="text-xs text-gray-500">
                    slug: {store.slug} · პროდუქტები: {store._count.products}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(store)}
                  >
                    რედ.
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(store.id, store._count.products)}
                  >
                    წაშლა
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
