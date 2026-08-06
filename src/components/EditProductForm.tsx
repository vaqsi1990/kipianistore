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
import { updateProduct, getProductById } from "@/lib/actions/actions";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ImageUpload from "@/components/CloudinaryUploader";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateProductSchema } from "@/lib/validators";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

type EditProductFormValues = z.infer<typeof updateProductSchema>;

interface EditProductFormProps {
  productId: string;
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<EditProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      id: productId,
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
  useEffect(() => {
    if (isOthersCategory) {
      // Clear sizes and brand for OTHERS category
      form.setValue("sizes", []);
      form.setValue("brand", "");
    } else {
      // Reset to default sizes for other categories if no sizes exist
      const currentSizes = form.getValues("sizes");
      if (!currentSizes || currentSizes.length === 0) {
        form.setValue("sizes", [{ size: "SIZE_80_190", price: 0 }]);
      }
      form.setValue("price", undefined);
    }
  }, [selectedCategory, form]);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await getProductById(productId);
        if (product) {
          form.reset({
            id: productId,
            title: product.title,
            titleEn: product.titleEn,
            category: product.category,
            images: product.images || [],
            brand: product.brand,
            description: product.description,
            descriptionEn: product.descriptionEn,
            price: product.price ? Number(product.price) : undefined,
            sizes: product.sizes?.map((size: any) => ({
              size: size.size,
              price: Number(size.price)
            })) || [{ size: "SIZE_80_190", price: 0 }],
            tbilisi: product.tbilisi || false,
            batumi: product.batumi || false,
            batumi44: product.batumi44 || false,
            qutaisi: product.qutaisi || false,
            kobuleti: product.kobuleti || false,
            popular: product.popular || false,
            sales: product.sales || 0,
          });
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setError("Failed to load product data");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, form]);

  const onSubmit = async (data: EditProductFormValues) => {
    try {
      setError(null);
    
      
      const res = await updateProduct({
        ...data,
        images: data.images.filter((url: any): url is string => typeof url === "string"),
      });

    

      if (res.success) {
        router.push("/adminall");
        router.refresh();
      } else {
        setError((res.message as string) ?? "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product. Please try again." as const);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
          <p className="text-gray-600">Update product information</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
                  <FormLabel>Title (Georgian)</FormLabel>
                  <FormControl>
                    <Input placeholder="Title" {...field} />
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
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Title in English" {...field} />
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
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full border rounded px-3 py-2">
                      <option value="MATTRESS">Mattress</option>
                      <option value="PILLOW">Pillow</option>
                      <option value="QUILT">Quilt</option>
                      <option value="PAD">Pad</option>
                      <option value="bundle">Bundle</option>
                      <option value="BED">Bed</option>
                      <option value="OTHERS">Others</option>
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
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} />
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
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full border rounded px-3 py-2">
                        <option value="">Select Brand</option>
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
                  <FormLabel>Description (Georgian)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description" {...field} />
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
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
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
                  <FormLabel className="text-base font-medium">Sizes and Prices</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSize}
                    className="text-sm"
                  >
                    + Add Size
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`sizes.${index}.size`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-sm">Size</FormLabel>
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
                          <FormLabel className="text-sm">Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
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
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Location checkboxes */}
            <div className="space-y-4">
              <FormLabel className="text-base font-medium">Location</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="tbilisi"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={e => field.onChange(e.target.checked)} 
                          />
                          Tbilisi
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batumi"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={e => field.onChange(e.target.checked)} 
                          />
                          Batumi
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="qutaisi"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={e => field.onChange(e.target.checked)} 
                          />
                          Qutaisi
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kobuleti"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={field.value} 
                            onChange={e => field.onChange(e.target.checked)} 
                          />
                          Kobuleti
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* sales */}
            <FormField
              control={form.control}
              name="sales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Discount"
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
                  <FormLabel className="text-base font-medium">Popular Product</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="popular"
                        checked={field.value} 
                        onChange={e => field.onChange(e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="popular" className="text-sm font-medium text-gray-700">
                        Mark as popular product
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors">
                {form.formState.isSubmitting ? "Updating..." : "Update"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/adminall")}
                className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
} 