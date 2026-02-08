import { supabaseBrowser } from "@/lib/supabase-browser";
import { Wishlist, WishlistAccent, WishlistVisibility } from "@/types/wishlist";
import { getWishlists } from "@/api/helpers/wishlist-helper";
import { CreateWishlistParams, UpdateWishlistParams } from "./types/wishilst";

export async function getMyWishlists(
  params: PaginationParams = {},
): Promise<Wishlist[]> {
  const {
    data: { session },
  } = await supabaseBrowser.auth.getSession();

  return getWishlists(
    (query) => query.eq("user_id", session?.user?.id),
    params,
  );
}

export async function getPublicWishlists(
  params: PaginationParams = {},
): Promise<Wishlist[]> {
  const {
    data: { session },
  } = await supabaseBrowser.auth.getSession();

  return getWishlists(
    (query) =>
      query
        .neq("user_id", session?.user?.id)
        .eq("visibility_type", WishlistVisibility.Public),
    params,
  );
}

export async function getFriendWishlists(
  friendUserId: string,
  params: PaginationParams = {},
): Promise<Wishlist[]> {
  const {
    data: { session },
  } = await supabaseBrowser.auth.getSession();

  if (friendUserId === session?.user?.id) {
    throw new Error("Use getMyWishlists for own wishlists");
  }

  return getWishlists((query) => query.eq("user_id", friendUserId), params);
}

export async function createWishlist({
  title,
  description,
  visibility = WishlistVisibility.Private,
  imageUrl,
  priority = 0,
  accent = WishlistAccent.Pink,
}: CreateWishlistParams): Promise<Wishlist> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowser.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabaseBrowser
    .from("wishlist")
    .insert({
      user_id: session.user.id,
      title,
      description,
      visibility_type: visibility,
      image_url: imageUrl,
      priority,
      accent_type: accent,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateWishlist(
  wishlistId: string,
  updates: UpdateWishlistParams,
): Promise<Wishlist> {
  const dbUpdates: Record<string, any> = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined)
    dbUpdates.description = updates.description;
  if (updates.visibility !== undefined)
    dbUpdates.visibility_type = updates.visibility;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.accent !== undefined) dbUpdates.accent_type = updates.accent;

  const { data, error } = await supabaseBrowser
    .from("wishlist")
    .update(dbUpdates)
    .eq("id", wishlistId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteWishlist(wishlistId: string): Promise<void> {
  const { error } = await supabaseBrowser
    .from("wishlist")
    .delete()
    .eq("id", wishlistId);

  if (error) throw error;
}
