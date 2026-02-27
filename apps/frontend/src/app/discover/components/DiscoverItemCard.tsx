"use client";

import { useState } from "react";
import styles from "./DiscoverItemCard.module.scss";
import { DiscoverItem } from "@/api/types/wishilst";
import { Heart, ExternalLink } from "lucide-react";
import { ItemDetailModal } from "./ItemDetailModal";
import { useCurrentUserId } from "@/hooks/use-user";

type Props = DiscoverItem & {
  onToggleReserve?: (id: string) => void;
};

export function DiscoverItemCard({
  id,
  title,
  price,
  store,
  image,
  isReserved,
  image_url,
  url,
  description,
  priority,
  reservedBy,
  onToggleReserve,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: currentUserId = "" } = useCurrentUserId();
  console.log("currentUserId ", { currentUserId, reservedBy });
  const reservedByMe = !!reservedBy && reservedBy.toString() === currentUserId;
  const canToggleReservation =  reservedByMe|| !isReserved;
  const imgSrc = image_url || image;

  return (
    <>
      <div className={styles.card} onClick={() => setDetailOpen(true)}>
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
          <span className={styles.price}>
            {typeof price === "number" ? `$${price.toFixed(2)}` : price}
          </span>
          {store && <small>{store}</small>}

          <div className={styles.actions}>
            <button
              className={`${styles.reserveBtn} ${isReserved ? styles.reserved : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canToggleReservation && onToggleReserve)
                  onToggleReserve(id);
              }}
              disabled={!canToggleReservation}
              aria-label={
                isReserved
                  ? reservedByMe
                    ? "Release reservation"
                    : "Already reserved"
                  : "Reserve item"
              }
            >
              <Heart size={16} fill={isReserved ? "currentColor" : "none"} />
            </button>

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkBtn}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      <ItemDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={{
          id,
          title,
          price,
          store,
          image: imgSrc,
          isReserved,
          image_url,
          url,
          description,
          priority,
          reservedBy,
        }}
        onToggleReserve={onToggleReserve}
      />
    </>
  );
}
