"use client";

import Link from "next/link";
import styles from "./DiscoverSection.module.scss";
import { DiscoverItemCard } from "./DiscoverItemCard";
import { DiscoverSection as Section } from "@/api/types/wishilst";

type Props = Section & {
  onToggleReserve?: (itemId: string) => void;
};

export function DiscoverSection({
  owner,
  username,
  wishlist,
  wishlist_id,
  date,
  friend_id,
  items,
  onToggleReserve,
}: Props) {
  const itemCount = items.length;

  return (
    <section className={styles.section}>
      <header>
        <div>
          <strong>{owner}</strong> · {wishlist}
          <span>
            @{username}
            {date && ` · ${date}`}
          </span>
        </div>

        {wishlist_id ? (
          <Link href={`/wishlist/${wishlist_id}`} className={styles.viewAll}>
            View all {itemCount}
          </Link>
        ) : friend_id ? (
          <Link href={`/friends/${friend_id}`} className={styles.viewAll}>
            View all {itemCount}
          </Link>
        ) : (
          <span className={styles.viewAll}>View all ({itemCount})</span>
        )}
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <DiscoverItemCard
            key={item.id}
            {...item}
            onToggleReserve={onToggleReserve}
          />
        ))}
      </div>
    </section>
  );
}
