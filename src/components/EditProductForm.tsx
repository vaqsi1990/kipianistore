"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/CloudinaryUploader";
import {
  updateFinaProductOverride,
  type FinaProductEditData,
} from "@/lib/actions/fina-product.actions";
import { finaProductOverrideSchema } from "@/lib/validators";

type FormValues = z.infer<typeof finaProductOverrideSchema>;

export default function EditProductForm({
  product,
  mode = "edit",
}: {
  product: FinaProductEditData;
  mode?: "edit" | "create";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(finaProductOverrideSchema),
    defaultValues: {
      finaId: product.id,
      images: product.images,
      title: product.title,
      titleEn: product.titleEn,
      description: product.description ?? "",
      descriptionEn: product.descriptionEn ?? "",
      brand: product.brand ?? "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const res = await updateFinaProductOverride(data);
    if (res.success) {
      router.push("/adminall");
      router.refresh();
      return;
    }
    setError(res.message || "Failed to update product");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "პროდუქტის დამატება" : "პროდუქტის რედაქტირება"}
        </h2>
        <p className="text-gray-600">
          {mode === "create"
            ? "ატვირთეთ სურათები და შეავსეთ სახელი/აღწერა. ფასი და მარაგი მოდის FINA-დან."
            : "სურათები, სახელი და აღწერა ინახება საიტზე. ფასი და მარაგი მოდის FINA-დან."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border bg-gray-50 p-3">
          <p className="text-gray-500">FINA კოდი</p>
          <p className="font-semibold">{product.code}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-3">
          <p className="text-gray-500">კატეგორია</p>
          <p className="font-semibold">{product.category}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-3">
          <p className="text-gray-500">ფასი (FINA)</p>
          <p className="font-semibold">₾{product.price.toFixed(2)}</p>
        </div>
      </div>

      {product.storeAvailability.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium mb-2">მარაგი ფილიალებში</p>
          <div className="flex flex-wrap gap-2">
            {product.storeAvailability.map((store) => (
              <span
                key={store.nameKa}
                className="text-xs rounded-full border px-3 py-1 bg-white"
              >
                {store.nameKa}: {store.stock}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>სურათები</FormLabel>
                <FormControl>
                  <ImageUpload
                    key={product.id}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>სახელი (ქართული)</FormLabel>
                <FormControl>
                  <Input placeholder="სახელი" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="titleEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English)</FormLabel>
                <FormControl>
                  <Input placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ბრენდი</FormLabel>
                <FormControl>
                  <Input placeholder="Brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>აღწერა (ქართული)</FormLabel>
                <FormControl>
                  <Textarea placeholder="აღწერა" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full px-4 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
            >
              {form.formState.isSubmitting
                ? "ინახება..."
                : mode === "create"
                  ? "დამატება"
                  : "შენახვა"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/adminall")}
              className="w-full px-4 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
            >
              გაუქმება
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
