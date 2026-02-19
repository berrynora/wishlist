export interface CreateItemParams {
  wishlist_id: string;
  name: string;
  description?: string | null;
  price?: string | null;
  priority?: number | null;
  image_url?: string | null;
  url?: string | null;
  status?: number;
}