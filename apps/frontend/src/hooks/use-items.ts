import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWishlistItems,
  createItem,
  updateItem,
  deleteItem,
  reserveItem,
  unreserveItem,
} from "@/api/items";
import type { CreateItemParams, UpdateItemParams } from "@/api/types/item";
import { wishlistKeys } from "./use-wishlists";

// Query Keys
export const itemKeys = {
  all: ["items"] as const,
  wishlist: (wishlistId: string, params?: PaginationParams) =>
    [...itemKeys.all, "wishlist", wishlistId, params] as const,
};

// Queries
export function useWishlistItems(
  wishlistId: string,
  params?: PaginationParams,
) {
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
        queryKey: itemKeys.wishlist(data.wishlist_id),
      });
      queryClient.invalidateQueries({
        queryKey: wishlistKeys.my(),
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateItemParams }) =>
      updateItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      queryClient.invalidateQueries({ queryKey: wishlistKeys.my() });
    },
  });
}

export function useReserveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reserveItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUnreserveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unreserveItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
