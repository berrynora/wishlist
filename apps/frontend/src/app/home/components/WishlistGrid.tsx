"use client";

import { WishlistCard } from "./WishlistCard";
import styles from "./WishlistGrid.module.scss";
import { useMyWishlists } from "@/hooks/use-wishlists";

export function WishlistGrid() {
  const { data, isLoading, isError } = useMyWishlists();

  return (
    <div>
      <h2 className={styles.title}>My Wishlists</h2>
      <div className={styles.grid}>
        {isLoading && <p>Loading...</p>}
        {isError && <p>Failed to load wishlists.</p>}
        {!isLoading && !isError && (data?.length ?? 0) === 0 && (
          <p>No wishlists yet.</p>
        )}
        {(data ?? []).map((w) => (
          <WishlistCard key={w.id} wishlist={w} />
        ))}
      </div>
    </div>
  );
}
