"use client";

import { useParams } from "next/navigation";
import { wishlistItemsMock } from "@/lib/wishlistItems.mock";
import { WishlistHeader } from "./components/WishlistHeader";
import { WishlistItemsGrid } from "./components/WishlistItemsGrid";
import styles from "./WishlistPage.module.scss";

export default function WishlistItemsPage() {
  const params = useParams();
  const id = params.id as string;

  const items = wishlistItemsMock[id] || [];

  // mock wishlist meta
  const wishlist = {
    title: "Birthday Wishes",
    description: "Things I'd love for my birthday this year!",
    visibility: "Friends only",
    itemsCount: items.length,
    accent: "pink",
  };

  return (
    <main className={styles.page}>
      <WishlistHeader wishlist={wishlist} />
      <WishlistItemsGrid items={items} />
    </main>
  );
}
