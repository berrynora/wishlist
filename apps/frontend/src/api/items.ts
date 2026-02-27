import { supabaseBrowser } from "@/lib/supabase-browser";
import { Item } from "@/types/item";
import { CreateItemParams, UpdateItemParams } from "./types/item";
import { getItems } from "./helpers/item-helper";

export async function createItem({
  wishlist_id,
  name,
  description,
  price,
  priority,
  image_url,
  url,
  status = 0,
}: CreateItemParams): Promise<Item> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowser.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabaseBrowser
    .from("item")
    .insert({
      wishlist_id,
      name,
      description,
      price,
      priority,
      image_url,
      url,
      status,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getWishlistItems(
  wishlistId: string,
  params: PaginationParams = {},
): Promise<Item[]> {
  return getItems((query) => query.eq("wishlist_id", wishlistId), params);
}

export async function updateItem(
  itemId: string,
  updates: UpdateItemParams,
): Promise<Item> {
  const { data, error } = await supabaseBrowser
    .from("item")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabaseBrowser
    .from("item")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function toggleItemReservation(itemId: string): Promise<Item> {
  const { data, error } = await supabaseBrowser.rpc('toggle_item_reservation', {
    p_item_id: itemId,
  });

  if (error) {
    console.error('Error toggling item reservation:', error);
    throw new Error(error.message || 'Failed to toggle reservation');
  }

  return data as Item;
}
