"use client";

import styles from "./DiscoverFilters.module.scss";

export function DiscoverFilters() {
  return (
    <div className={styles.filters}>
      <button className={styles.active}>All Wishlists</button>
      <button>Reserved</button>
    </div>
  );
}
