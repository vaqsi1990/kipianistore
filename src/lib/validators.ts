import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";

// descriptionEn: z.string(),
// weight: z.number().positive(),
// height: z.number().positive(),
// material: z.string(),
// materialEn: z.string(),
// type: z.enum(['MATTRESS', 'PILLOW', 'QUILT', 'PAD']),
const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    "Price must have exactly two decimal places"
  );

// Base product schema without refinement
const BaseProductSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().min(1),
  category: z.enum(["MATTRESS", "PILLOW", "bundle", "QUILT", "PAD", "BED", "OTHERS"]),
  images: z.array(z.string()).min(1),

  brand: z.string().optional(), // Make brand optional for OTHERS category
  description: z.string().min(1),
  descriptionEn: z.string().min(1),
  price: z.number().positive().optional(), // For products without sizes (like OTHERS)
  sizes: z.array(z.object({
    size: z.enum([
      "SIZE_80_190", "SIZE_80_200", "SIZE_90_190", "SIZE_90_200", "SIZE_100_190", 
      "SIZE_100_200", "SIZE_110_190", "SIZE_110_200", "SIZE_120_190", "SIZE_120_200", 
      "SIZE_130_190", "SIZE_130_200", "SIZE_140_190", "SIZE_140_200", "SIZE_150_190", 
      "SIZE_150_200", "SIZE_160_190", "SIZE_160_200", "SIZE_170_190", "SIZE_170_200", 
      "SIZE_180_190", "SIZE_180_200", "SIZE_190_190", "SIZE_190_200", "SIZE_200_200",
      "SIZE_200_220", "SIZE_220_220"
    ]),
    price: z.number().positive()
  })).optional(), // Make sizes optional

  tbilisi: z.boolean().optional(),
  batumi: z.boolean().optional(),
  batumi44: z.boolean().optional(),
  qutaisi: z.boolean().optional(),
  kobuleti: z.boolean().optional(),

  popular: z.boolean().optional(),
  sales: z.number().int().nonnegative().optional(),
});

// Product schema with refinement
export const ProductSchema = BaseProductSchema.refine((data) => {
  // OTHERS category: must have price, no sizes, no brand required
  if (data.category === "OTHERS") {
    return data.price !== undefined && (!data.sizes || data.sizes.length === 0);
  } else {
    // Other categories: must have sizes and brand
    return data.sizes !== undefined && data.sizes.length > 0 && data.brand && data.brand.length > 0;
  }
}, {
  message: "OTHERS category must have a price (no sizes/brands), other categories must have sizes and brand",
  path: ["category"]
});

export const updateProductSchema = BaseProductSchema.extend({
  id: z.string().min(1, "Id is required"),
}).refine((data) => {
  // OTHERS category: must have price, no sizes, no brand required
  if (data.category === "OTHERS") {
    return data.price !== undefined && (!data.sizes || data.sizes.length === 0);
  } else {
    // Other categories: must have sizes and brand
    return data.sizes !== undefined && data.sizes.length > 0 && data.brand && data.brand.length > 0;
  }
}, {
  message: "OTHERS category must have a price (no sizes/brands), other categories must have sizes and brand",
  path: ["category"]
});

// Schema for signing users in
// Schema for signing users in
export const signInFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

// Schema for signing up a user
export const signUpFormSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(15, "Name must be at most 20 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  size: z.string().min(1, "Size is required"),
  qty: z.number().int().nonnegative("Quantity must be a positive number"),
  image: z.string().min(1, "Image is required"),
  price: currency,
  tbilisi: z.boolean().optional(),
  batumi: z.boolean().optional(),
  batumi44: z.boolean().optional(),
  qutaisi: z.boolean().optional(),
  kobuleti: z.boolean().optional(),
});

export const insertCartSchema = z.object({
  items: z.array(cartItemSchema),
  itemsPrice: currency,
  totalPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  sessionCartId: z.string().min(1, "Session cart id is required"),
  userId: z.string().optional().nullable(),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  streetAddress: z.string().min(3, "Address must be at least 3 characters"),
  city: z.string().min(3, "City must be at least 3 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  country: z.string().min(3, "Country must be at least 3 characters"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const insertReviewSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  productId: z.string().min(1, "Product is required"),
  userId: z.string().min(1, "User is required"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});
