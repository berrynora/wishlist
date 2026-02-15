"use client";

import styles from "./WishlistHeader.module.scss";
import { Button } from "@/components/ui/Button/Button";
import { Grid, List } from "lucide-react";
import { useState } from "react";

export function WishlistHeader({ wishlist }: any) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className={`${styles.header} ${styles[wishlist.accent]}`}>
      <div className={styles.inner}>
        <div>
          <h1>{wishlist.title}</h1>
          <p>{wishlist.description}</p>

          <div className={styles.meta}>
            <span className={styles.visibility}>{wishlist.visibility}</span>
            <span>{wishlist.itemsCount} items</span>
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

          <Button>Add Item</Button>
        </div>
      </div>
    </div>
  );
}
