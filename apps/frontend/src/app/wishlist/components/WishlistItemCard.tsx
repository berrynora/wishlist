"use client";

import styles from "./WishlistItemCard.module.scss";
import { useEffect, useRef, useState } from "react";
import { Item } from "@/types/item";
import {
  Heart,
  ExternalLink,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { data: currentUserId = "" } = useCurrentUserId();

  const isReserved = item.status === 1 || !!item.reserved_by;
  const reservedByMe = currentUserId
    ? item.reserved_by === currentUserId
    : false;
  const canToggleReservation = !isOwner && (!isReserved || reservedByMe);
  const hasImage = Boolean(item.image_url);
  const price = item.price || "";
  const title = item.name;
  const priorityLabel: Record<number, "Low" | "Medium" | "High"> = {
    1: "Low",
    2: "Medium",
    3: "High",
  };

  const priority = item.priority ? priorityLabel[item.priority] : null;
  const store = (() => {
    if (!item.url) return "";
    try {
      return new URL(item.url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  })();

  const formattedPrice = (() => {
    if (!price) return "";
    return price.startsWith("$") ? price : `$${price}`;
  })();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <div className={styles.card} onClick={() => setDetailOpen(true)}>
        <div className={styles.media}>
          <div className={styles.imageFrame}>
            {hasImage ? (
              <img src={item.image_url as string} alt={title} />
            ) : (
              <div className={styles.placeholder}>
                <ShoppingBag size={32} />
              </div>
            )}
          </div>

          {isReserved && !isOwner && (
            <div className={styles.badgeLeft}>
              <Heart size={14} fill="currentColor" />
              <span>{reservedByMe ? "Reserved by you" : "Reserved"}</span>
            </div>
          )}

          {priority && (
            <div className={`${styles.badgeRight} ${styles[priority.toLowerCase()]}`}>
              {priority}
            </div>
          )}

          <div className={styles.quickActions}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.iconButton}
                onClick={(e) => e.stopPropagation()}
                aria-label="Open product link"
              >
                <ExternalLink size={16} />
              </a>
            )}

            {isOwner && (
              <div className={styles.menuWrapper} ref={menuRef}>
                <button
                  className={styles.iconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((prev) => !prev);
                  }}
                  aria-label="Open item menu"
                >
                  <MoreHorizontal size={16} />
                </button>

                {menuOpen && (
                  <div className={styles.dropdown}>
                    <button
                      className={styles.dropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        if (onEdit) onEdit(item);
                      }}
                    >
                      <span>Edit</span>
                    </button>
                    <button
                      className={styles.dropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        if (onDelete) onDelete(item.id);
                      }}
                    >
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <h3>{title}</h3>
          <div className={styles.metaRow}>
            {formattedPrice && (
              <span className={styles.price}>{formattedPrice}</span>
            )}
            {store && <span className={styles.store}>{store}</span>}
          </div>

          {!isOwner && (
            <button
              className={`${styles.reserveBtn} ${isReserved ? styles.reserved : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canToggleReservation && onToggleReserve)
                  onToggleReserve(item.id);
              }}
              disabled={!canToggleReservation}
            >
              <Heart size={16} fill={isReserved ? "currentColor" : "none"} />
              <span>
                {isReserved
                  ? reservedByMe
                    ? "Reserved by you"
                    : "Reserved"
                  : "Reserve this gift"}
              </span>
            </button>
          )}
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
