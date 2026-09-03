import { z } from 'zod';
import {
  ProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,

  insertReviewSchema,
} from '@/lib/validators';

export type Product = z.infer<typeof ProductSchema> & {
  id: string;
  rating: string;
  numReviews: number;
  createdAt: Date;
};

export type Cart = z.infer<typeof insertCartSchema> & {
  id: string;
};
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;


export type Review = z.infer<typeof insertReviewSchema> & {
  id: string;
  createdAt: Date;
  user?: { name: string };
};