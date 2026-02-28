/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import styles from "./ReservedItemCard.module.scss";
import { ReservedItem } from "@/api/types/wishilst";
import { Heart } from "lucide-react";
import { ItemDetailModal } from "./ItemDetailModal";
import { useCurrentUserId } from "@/hooks/use-user";

type Props = ReservedItem & {
  onToggleReserve?: (id: string) => void;
};

export function ReservedItemCard({
  item_id,
  title,
  price,
  store,
  image,
  priority,
  owner_name,
  wishlist_title,
  onToggleReserve,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: currentUserId = "" } = useCurrentUserId();
  const isReserved = true;
  const reservedBy = currentUserId;
  const canToggleReservation = true;

  const imgSrc = image;
  const priceNumber = typeof price === "number" ? price : Number(price) || 0;

  return (
    <>
      <div className={styles.card} onClick={() => setDetailOpen(true)}>
        <div className={styles.ownerRow}>
          <span className={styles.owner}>{owner_name}</span>
          <span className={styles.wishlist}>{wishlist_title}</span>
        </div>

        {priority && <span className={styles.priority}>{priority}</span>}

        <div className={styles.imageWrapper}>
          {imgSrc ? (
            <img src={imgSrc} alt={title} />
          ) : (
            <div className={styles.placeholder}>No image</div>
          )}
        </div>

        <div className={styles.info}>
          <strong>{title}</strong>
          <span className={styles.price}>${priceNumber.toFixed(2)}</span>
          {store && <small>{store}</small>}

          <div className={styles.actions}>
            <button
              className={`${styles.reserveBtn} ${styles.reserved}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canToggleReservation && onToggleReserve)
                  onToggleReserve(item_id);
              }}
              aria-label="Release reservation"
            >
              <Heart size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      <ItemDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={{
          id: item_id,
          title,
          price: priceNumber,
          store,
          image: imgSrc,
          isReserved,
          description: null,
          priority: priority ?? undefined,
          reservedBy,
        }}
        onToggleReserve={onToggleReserve}
      />
    </>
  );
}
