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
  date,
  friend_id,
  items,
  onToggleReserve,
}: Props) {
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

        {friend_id ? (
          <Link href={`/friends/${friend_id}`} className={styles.viewAll}>
            View all
          </Link>
        ) : (
          <span className={styles.viewAll}>View all</span>
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
