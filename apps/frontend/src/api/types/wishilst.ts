import { Item, WishlistAccent, WishlistVisibility } from "@/types/wishlist";

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

export interface WishlistWithItems {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  items_count: number;
  items: Item[];
}