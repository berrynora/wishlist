import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWishlistItems,
  createItem,
} from '@/api/items';
import type {
  CreateItemParams
} from '@/api/types/item';

// Query Keys
export const itemKeys = {
  all: ['items'] as const,
  wishlist: (wishlistId: string, params?: PaginationParams) => 
    [...itemKeys.all, 'wishlist', wishlistId, params] as const,
};

// Queries
export function useWishlistItems(wishlistId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: itemKeys.wishlist(wishlistId, params),
    queryFn: () => getWishlistItems(wishlistId, params),
    enabled: !!wishlistId,
  });
}

// Mutations
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateItemParams) => createItem(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: itemKeys.wishlist(data.wishlist_id) 
      });
    },
  });
}