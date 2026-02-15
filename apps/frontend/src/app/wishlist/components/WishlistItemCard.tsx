"use client";

import { useState } from "react";
import styles from "./WishlistItemCard.module.scss";
import { AppButton } from "@/components/ui/AppButton";

export function WishlistItemCard({
  title,
  price,
  reserved,
}: {
  title: string;
  price: number;
  reserved: boolean;
}) {
  const [isReserved, setReserved] = useState(reserved);

  return (
    <div className={styles.card}>
      <div className={styles.image} />

      <div className={styles.info}>
        <strong>{title}</strong>
        <span>${price}</span>

        {!isReserved ? (
          <AppButton
            className={styles.reserve}
            onClick={() => setReserved(true)}
          >
            Reserve
          </AppButton>
        ) : (
          <AppButton variant="secondary" disabled>
            Reserved
          </AppButton>
        )}
      </div>
    </div>
  );
}
