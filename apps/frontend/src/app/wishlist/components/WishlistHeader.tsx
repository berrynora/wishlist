"use client";

import styles from "./WishlistHeader.module.scss";
import { Button } from "@/components/ui/Button/Button";
import { Grid, List } from "lucide-react";
import { useState } from "react";
import { Wishlist } from "@/types/wishlist";
import { accentClass, visibilityLabel } from "@/lib/helpers/wishlist-helper";

type Props = {
  wishlist: Wishlist;
  onAddItem?: () => void;
};

export function WishlistHeader({ wishlist, onAddItem }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const accent = accentClass[wishlist.accent_type] ?? "pink";
  const visibility = visibilityLabel[wishlist.visibility_type] ?? "Private";
  const itemsCount = wishlist.itemsCount ?? 0;
  const description = wishlist.description ?? "";

  return (
    <div className={`${styles.header} ${styles[accent]}`}>
      <div className={styles.inner}>
        <div>
          <h1>{wishlist.title}</h1>
          {description && <p>{description}</p>}

          <div className={styles.meta}>
            <span className={styles.visibility}>{visibility}</span>
            <span>{itemsCount} items</span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              className={view === "grid" ? styles.active : ""}
              onClick={() => setView("grid")}
            >
              <Grid size={16} />
            </button>

            <button
              className={view === "list" ? styles.active : ""}
              onClick={() => setView("list")}
            >
              <List size={16} />
            </button>
          </div>

          <Button onClick={onAddItem}>Add Item</Button>
        </div>
      </div>
    </div>
  );
}
