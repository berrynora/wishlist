"use client";

import { useParams } from "next/navigation";
import { WishlistHeader } from "../components/WishlistHeader";
import { WishlistItemsGrid } from "../components/WishlistItemsGrid";
import { useWishlistItems } from "@/hooks/use-items";
import { useWishlistById } from "@/hooks/use-wishlists";
import { useState } from "react";
import { CreateItemModal } from "../components/CreateItemModal";
import styles from "./WishlistPage.module.scss";

export default function WishlistItemsPage() {
  const params = useParams();
  const id = params.id as string;
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: wishlist,
    isLoading: wishlistLoading,
    isError: wishlistError,
  } = useWishlistById(id);

  const {
    data: itemsData,
    isLoading: itemsLoading,
    isError: itemsError,
  } = useWishlistItems(id);

  const items = itemsData ?? [];

  return (
    <main className={styles.page}>
      {wishlistLoading && <p>Loading wishlist...</p>}
      {wishlistError && <p>Failed to load wishlist.</p>}
      {wishlist && (
        <WishlistHeader wishlist={wishlist} onAddItem={() => setCreateOpen(true)} />
      )}

      {itemsLoading && <p>Loading items...</p>}
      {itemsError && <p>Failed to load items.</p>}
      {!itemsLoading && !itemsError && items.length === 0 && <p>No items yet.</p>}
      {!itemsLoading && !itemsError && items.length > 0 && (
        <WishlistItemsGrid items={items} />
      )}

      <CreateItemModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        wishlistId={id}
      />
    </main>
  );
}
