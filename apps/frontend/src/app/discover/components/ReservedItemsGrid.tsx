"use client";

import styles from "./ReservedItemsGrid.module.scss";
import { ReservedItemCard } from "./ReservedItemCard";
import { ReservedItem } from "@/api/types/wishilst";

type Props = {
  items: ReservedItem[];
  onToggleReserve?: (itemId: string) => void;
};

export function ReservedItemsGrid({ items, onToggleReserve }: Props) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <div key={item.item_id} className={styles.cardWrap}>
          <ReservedItemCard
            {...item}
            onToggleReserve={onToggleReserve}
          />
        </div>
      ))}
    </div>
  );
}
