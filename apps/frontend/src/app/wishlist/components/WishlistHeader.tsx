"use client";

import styles from "./WishlistHeader.module.scss";
import { ArrowLeft, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { Wishlist } from "@/types/wishlist";
import { accentClass } from "@/lib/helpers/wishlist-helper";
import { WishlistInfo } from "./WishlistInfo";

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

      <WishlistInfo
        wishlist={wishlist}
        isOwner={isOwner}
        onAddItem={onAddItem}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
