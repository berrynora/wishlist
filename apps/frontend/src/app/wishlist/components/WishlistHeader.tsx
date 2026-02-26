"use client";

import styles from "./WishlistHeader.module.scss";
import { Button } from "@/components/ui/Button/Button";
import { ArrowLeft, Calendar, Gift, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Wishlist } from "@/types/wishlist";
import {
  accentClass,
  visibilityLabel,
  visibilityIcon,
} from "@/lib/helpers/wishlist-helper";

type Props = {
  wishlist: Wishlist;
  onAddItem?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
};

export function WishlistHeader({
  wishlist,
  onAddItem,
  onEdit,
  onDelete,
  isOwner = false,
}: Props) {
  const router = useRouter();

  const accent = accentClass[wishlist.accent_type] ?? "pink";
  const visibility = visibilityLabel[wishlist.visibility_type] ?? "Private";
  const VisibilityIcon = visibilityIcon[wishlist.visibility_type];
  const itemsCount = wishlist.itemsCount ?? 0;
  const description = wishlist.description ?? "";
  const eventDate = (wishlist as Wishlist & { event_date?: string }).event_date;

  return (
    <div className={styles.header}>
      <div className={`${styles.banner} ${styles[accent]}`}>
        <div className={styles.bannerInner}>
          <button className={styles.back} onClick={() => router.push("/home")}>
            <ArrowLeft size={18} />
          </button>

          <div className={styles.bannerIcon}>
            <Gift size={32} />
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h1>{wishlist.title}</h1>
            {description && <p className={styles.description}>{description}</p>}
          </div>

          {isOwner && (
            <div className={styles.ownerActions}>
              <Button size="sm" onClick={onAddItem}>
                <Plus size={14} />
                <span>Add Item</span>
              </Button>
              <button
                className={styles.iconBtn}
                onClick={onEdit}
                title="Edit wishlist"
              >
                <Pencil size={15} />
              </button>
              <button
                className={`${styles.iconBtn} ${styles.dangerBtn}`}
                onClick={onDelete}
                title="Delete wishlist"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        <div className={styles.badges}>
          <span className={styles.visibilityBadge}>
            {VisibilityIcon && <VisibilityIcon size={13} />}
            {visibility}
          </span>
          <span className={styles.countBadge}>
            {itemsCount} {itemsCount === 1 ? "item" : "items"}
          </span>
          {eventDate && (
            <span className={styles.dateBadge}>
              <Calendar size={13} />
              {new Date(eventDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
