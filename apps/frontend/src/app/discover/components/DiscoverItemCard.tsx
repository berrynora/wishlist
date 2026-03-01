"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DiscoverItemCard.module.scss";
import { DiscoverItem } from "@/api/types/wishilst";
import { Heart, ExternalLink, MoreHorizontal } from "lucide-react";
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
  share_url,
  onToggleReserve,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { data: currentUserId = "" } = useCurrentUserId();
  const reservedByMe = !!reservedBy && reservedBy.toString() === currentUserId;
  const canToggleReservation = reservedByMe || !isReserved;
  const imgSrc = image_url || image;
  const shareLink = share_url || url || "";
  const hasShareLink = Boolean(shareLink);
  const hasProductLink = Boolean(url);
  const formattedPrice =
    typeof price === "number"
      ? `$${price.toFixed(2)}`
      : price?.toString().startsWith("$")
        ? price.toString()
        : price
          ? `$${price}`
          : "";

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
        }
      }

      if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const handleShare = async () => {
      if (!shareLink) return;

      try {
        if (navigator.share) {
          await navigator.share({ url: shareLink });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareLink);
        } else {
          window.open(shareLink, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        console.error("Failed to share item", error);
      } finally {
        setMenuOpen(false);
      }
    };

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

            <div className={styles.quickActions}>
              <a
                href={hasProductLink ? url : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.iconButton} ${!hasProductLink ? styles.disabled : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasProductLink) e.preventDefault();
                }}
                aria-label="Open product link"
                aria-disabled={!hasProductLink}
              >
                <ExternalLink size={16} />
              </a>

              <div className={styles.menuWrapper} ref={menuRef}>
                <button
                  className={`${styles.iconButton} ${!hasShareLink ? styles.disabled : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!hasShareLink) return;
                    setMenuOpen((prev) => !prev);
                  }}
                  aria-label="Open item menu"
                  aria-disabled={!hasShareLink}
                >
                  <MoreHorizontal size={16} />
                </button>

                {menuOpen && (
                  <div className={styles.dropdown}>
                    <button
                      className={`${styles.dropdownItem} ${hasShareLink ? styles.shareItem : styles.disabled}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!hasShareLink) return;
                        handleShare();
                      }}
                      aria-disabled={!hasShareLink}
                    >
                      <span>Share</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>

        <div className={styles.info}>
          <strong>{title}</strong>

          <div className={styles.metaRow}>
            {formattedPrice && <span className={styles.price}>{formattedPrice}</span>}
            {store && <span className={styles.store}>{store}</span>}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.reserveBtn} ${isReserved ? styles.reserved : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (canToggleReservation && onToggleReserve)
                  onToggleReserve(id);
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
          share_url,
          description,
          priority,
          reservedBy,
        }}
        onToggleReserve={onToggleReserve}
      />
    </>
  );
}
