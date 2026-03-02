"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
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
        <div className={styles.meta}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              <UserRound size={16} />
            </span>

            <div className={styles.title}>
              <div className={styles.titleRow}>
                <span className={styles.owner}>{owner}</span>
                  <span className={styles.arrow} aria-hidden="true">&gt;</span>
                <span className={styles.wishlist}>{wishlist}</span>
              </div>

              <span className={styles.subline}>
                @{username}
                {date && ` · ${date}`}
              </span>
            </div>
          </div>
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
