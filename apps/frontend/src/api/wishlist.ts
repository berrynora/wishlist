import { supabaseBrowser } from "@/lib/supabase-browser";

export async function getMyWishlists(): Promise<any[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowser.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabaseBrowser
    .from('wishlist')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function getFriendsWishlists(): Promise<any[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowser.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabaseBrowser
    .from('wishlist')
    .select('*')
    .neq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function getFriendWishlists(
  friendUserId: string,
): Promise<any[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowser.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('Not authenticated');

  if (friendUserId === session.user.id) {
    throw new Error('Use getMyWishlists for own wishlists');
  }

  const { data, error } = await supabaseBrowser
    .from('wishlist')
    .select('*')
    .eq('user_id', friendUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function createWishlist(
  name: string,
  description?: string,
  access = false,
): Promise<any> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseBrowser.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabaseBrowser
    .from('wishlist')
    .insert({
      user_id: session.user.id,
      name,
      description,
      access,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
