"use client";

import styles from "./DiscoverFilters.module.scss";

type Props = {
  active: "wishlists" | "reserved";
  onChange: (v: "wishlists" | "reserved") => void;
};

export function DiscoverFilters({ active, onChange }: Props) {
  return (
    <div className={styles.filters}>
      <button
        className={active === "wishlists" ? styles.active : ""}
        onClick={() => onChange("wishlists")}
      >
        All Wishlists
      </button>
      <button
        className={active === "reserved" ? styles.active : ""}
        onClick={() => onChange("reserved")}
      >
        Reserved
      </button>
    </div>
  );
}
