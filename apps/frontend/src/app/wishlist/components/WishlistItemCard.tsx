"use client";

import styles from "./WishlistItemCard.module.scss";
import { useState } from "react";
import { Item } from "@/types/item";
import { Heart, ExternalLink, Trash2, Pencil } from "lucide-react";
import { WishlistItemDetailModal } from "./WishlistItemDetailModal";
import { useCurrentUserId } from "@/hooks/use-user";

type Props = {
  item: Item;
  isOwner?: boolean;
  onToggleReserve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: Item) => void;
};

export function WishlistItemCard({
  item,
  isOwner = false,
  onToggleReserve,
  onDelete,
  onEdit,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: currentUserId = "" } = useCurrentUserId();

  const isReserved = item.status === 1 || !!item.reserved_by;
  const reservedByMe = currentUserId
    ? item.reserved_by === currentUserId
    : false;
  const canToggleReservation = !isOwner && (!isReserved || reservedByMe);
  const hasImage = Boolean(item.image_url);
  const price = item.price || "";
  const title = item.name;

  return (
    <>
      <div className={styles.card} onClick={() => setDetailOpen(true)}>
        <div className={styles.image}>
          {hasImage ? (
            <img src={item.image_url as string} alt={title} />
          ) : (
            <div className={styles.placeholder}>No image</div>
          )}
        </div>

        <div className={styles.content}>
          <h3>{title}</h3>
          {price && <span className={styles.price}>{price}</span>}
          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}

          <div className={styles.actions}>
            {!isOwner && (
              <button
                className={`${styles.reserveBtn} ${isReserved ? styles.reserved : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canToggleReservation && onToggleReserve)
                    onToggleReserve(item.id);
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
            )}

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkBtn}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            )}

            {isOwner && (
              <>
                <button
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit(item);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDelete) onDelete(item.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <WishlistItemDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={item}
        isOwner={isOwner}
        onToggleReserve={onToggleReserve}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </>
  );
}
