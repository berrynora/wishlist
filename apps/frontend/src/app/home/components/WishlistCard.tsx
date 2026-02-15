"use client";

import { useRouter } from "next/navigation";
import styles from "./WishlistCard.module.scss";
import { Wishlist } from "@/types/wishlist";
import { Gift, Users, Globe, Lock } from "lucide-react";

const visibilityIcon = {
  Public: <Globe size={14} />,
  "Friends only": <Users size={14} />,
  Private: <Lock size={14} />,
};

export function WishlistCard({ wishlist }: { wishlist: Wishlist }) {
  const router = useRouter();

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/wishlist/${wishlist.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className={`${styles.top} ${styles[wishlist.accent]}`}>
        <Gift size={40} className={styles.icon} />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{wishlist.title}</h3>

        <div className={styles.meta}>
          <span className={styles.items}>{wishlist.itemsCount} items</span>

          <span className={styles.visibility}>
            {visibilityIcon[wishlist.visibility]}
            {wishlist.visibility}
          </span>
        </div>
      </div>
    </div>
  );
}
