"use client";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { DiscoverItem } from "@/api/types/wishilst";
import { Heart, ExternalLink } from "lucide-react";
import styles from "./ItemDetailModal.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
  item: DiscoverItem;
  onReserve?: (id: string) => void;
};

export function ItemDetailModal({ open, onClose, item, onReserve }: Props) {
  const isReserved = item.status === 1 || !!item.reserved_by;
  const imgSrc = item.image_url || item.image;

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.container}>
        {imgSrc && (
          <div className={styles.imageSection}>
            <img src={imgSrc} alt={item.title} />
          </div>
        )}

        <div className={styles.details}>
          <h2>{item.title}</h2>

          {item.description && (
            <p className={styles.description}>{item.description}</p>
          )}

          <div className={styles.meta}>
            {item.price != null && (
              <span className={styles.price}>
                {typeof item.price === "number"
                  ? `$${item.price.toFixed(2)}`
                  : item.price}
              </span>
            )}
            {item.store && <span className={styles.store}>{item.store}</span>}
            {item.priority && (
              <span className={styles.priority}>{item.priority}</span>
            )}
          </div>

          <div className={styles.footer}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkBtn}
              >
                <ExternalLink size={14} />
                <span>Visit website</span>
              </a>
            )}

            <Button
              variant={isReserved ? "secondary" : "primary"}
              onClick={() => {
                if (!isReserved && onReserve) onReserve(item.id);
              }}
              disabled={isReserved}
            >
              <Heart
                size={16}
                fill={isReserved ? "currentColor" : "none"}
                style={{ marginRight: 6 }}
              />
              {isReserved ? "Reserved" : "Reserve this gift"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
