"use client";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/lib/actions/actions";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ImageUpload  from "@/components/CloudinaryUploader";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductSchema } from "@/lib/validators";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import React from "react";

type ProductFormValues = z.infer<typeof ProductSchema>;

export async function formatError(error: any) {
  // ... error formatting logic
}

export default function ProductForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      title: "",
      titleEn: "",
      category: "MATTRESS",
      images: [],
      brand: "",
      description: "",
      descriptionEn: "",
      price: undefined,
      sizes: [{ size: "SIZE_80_190", price: 0 }],
      tbilisi: false,
      batumi: false,
      batumi44: false,
      qutaisi: false,
      kobuleti: false,
      popular: false,
      sales: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sizes",
  });

  const selectedCategory = form.watch("category");
  const isOthersCategory = selectedCategory === "OTHERS";

  // Reset form fields when category changes
  React.useEffect(() => {
    if (isOthersCategory) {
      // Clear sizes and brand for OTHERS category
      form.setValue("sizes", []);
      form.setValue("brand", "");
    } else {
      // Reset to default sizes for other categories
      form.setValue("sizes", [{ size: "SIZE_80_190", price: 0 }]);
      form.setValue("price", undefined);
    }
  }, [selectedCategory, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setError(null);
      const res = await createProduct({
        ...data,
        images: data.images.filter((url): url is string => typeof url === "string"),
      });

      if (res.success) {
        form.reset();
        router.push("/");
        router.refresh();
      } else {
        const message = await res.message;
        setError(message || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setError("Failed to create product. Please try again.");
    }
  };

  const addSize = () => {
    append({ size: "SIZE_80_190", price: 0 });
  };

  const removeSize = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">პროდუქტის დამატება</h1>
        <p className="text-gray-600">შეავსეთ ფორმა პროდუქტის დასამატებლად</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>სახელი</FormLabel>
                <FormControl>
                  <Input placeholder="პროდუქტის სახელი" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* titleEn */}
          <FormField
            control={form.control}
            name="titleEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English)</FormLabel>
                <FormControl>
                  <Input placeholder="Product name in English" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>კატეგორია</FormLabel>
                <FormControl>
                  <select {...field} className="w-full border rounded px-3 py-2">
                    <option value="MATTRESS">MATTRESS</option>
                    <option value="PILLOW">PILLOW</option>
                    <option value="bundle">BUNDLE</option>
                    <option value="QUILT">QUILT</option>
                    <option value="PAD">PAD</option>
                    <option value="BED">BED</option>
                    <option value="OTHERS">OTHERS</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* images */}
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>სურათები</FormLabel>
                <FormControl>
                  <ImageUpload  value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* brand - only show for non-OTHERS categories */}
          {!isOthersCategory && (
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ბრენდი</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full border rounded px-3 py-2">
                      <option value="">აირჩიეთ ბრენდი</option>
                      <option value="Sevyat">Sevyat</option>
                      <option value="IDAŞ">IDAŞ</option>
                      <option value="İsbiryatak">İsbiryatak</option>
                      <option value="Sleepnice">Sleepnice</option>
                      <option value="Sleepandbed">Sleepandbed</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>აღწერა (ქართულად)</FormLabel>
                <FormControl>
                  <Textarea placeholder="აღწერა" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* descriptionEn */}
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Description in English" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price field for OTHERS category */}
          {isOthersCategory && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ფასი</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="ფასი"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Sizes and Prices - only show for non-OTHERS categories */}
          {!isOthersCategory && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">ზომები და ფასები</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSize}
                  className="text-sm"
                >
                  + ზომის დამატება
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`sizes.${index}.size`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm">ზომა</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full border rounded px-3 py-2">
                            <option value="SIZE_80_190">80-190</option>
                            <option value="SIZE_80_200">80-200</option>
                            <option value="SIZE_90_190">90-190</option>
                            <option value="SIZE_90_200">90-200</option>
                            <option value="SIZE_100_190">100-190</option>
                            <option value="SIZE_100_200">100-200</option>
                            <option value="SIZE_110_190">110-190</option>
                            <option value="SIZE_110_200">110-200</option>
                            <option value="SIZE_120_190">120-190</option>
                            <option value="SIZE_120_200">120-200</option>
                            <option value="SIZE_130_190">130-190</option>
                            <option value="SIZE_130_200">130-200</option>
                            <option value="SIZE_140_190">140-190</option>
                            <option value="SIZE_140_200">140-200</option>
                            <option value="SIZE_150_190">150-190</option>
                            <option value="SIZE_150_200">150-200</option>
                            <option value="SIZE_160_190">160-190</option>
                            <option value="SIZE_160_200">160-200</option>
                            <option value="SIZE_170_190">170-190</option>
                            <option value="SIZE_170_200">170-200</option>
                            <option value="SIZE_180_190">180-190</option>
                            <option value="SIZE_180_200">180-200</option>
                            <option value="SIZE_190_190">190-190</option>
                            <option value="SIZE_190_200">190-200</option>
                            <option value="SIZE_200_200">200-200</option>
                            <option value="SIZE_200_220">200-220</option>
                            <option value="SIZE_220_220">220-220</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`sizes.${index}.price`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm">ფასი</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="ფასი"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSize(index)}
                      className="text-sm"
                    >
                      წაშლა
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* tbilisi */}
          <FormField
            control={form.control}
            name="tbilisi"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    თბილისი
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          {/* batumi */}
          <FormField
            control={form.control}
            name="batumi"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    ბათუმი
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          {/* batumi44 */}
          <FormField
            control={form.control}
            name="batumi44"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    ბათუმი (44)
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          {/* qutaisi */}
          <FormField
            control={form.control}
            name="qutaisi"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    ქუთაისი
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          {/* kobuleti */}
          <FormField
            control={form.control}
            name="kobuleti"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    ქობულეთი
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          {/* sales */}
          <FormField
            control={form.control}
            name="sales"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ფასდაკლება</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ფასდაკლება"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* popular */}
          <FormField
            control={form.control}
            name="popular"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    პოპულარული
                  </label>
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors">
            {form.formState.isSubmitting ? "იტვირთება..." : "დამატება"}
          </Button>
        </form>
      </Form>
    </>
  );
} 