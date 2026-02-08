import { WishlistAccent, WishlistVisibility } from "@/types/wishlist";

export interface CreateWishlistParams {
  title: string;
  description?: string;
  visibility?: WishlistVisibility;
  imageUrl?: string;
  priority?: number;
  accent?: WishlistAccent;
}

export interface UpdateWishlistParams {
  title?: string;
  description?: string;
  visibility?: WishlistVisibility;
  imageUrl?: string;
  priority?: number;
  accent?: WishlistAccent;
}