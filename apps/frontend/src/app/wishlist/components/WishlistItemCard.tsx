import styles from "./WishlistItemCard.module.scss";
import { Button } from "@/components/ui/Button/Button";
import { useState } from "react";

export function WishlistItemCard({ item }: any) {
  const [reserved, setReserved] = useState(item.reserved);

  return (
    <div className={styles.card}>
      <div className={styles.image} />

      <div className={styles.content}>
        <h3>{item.title}</h3>
        <span className={styles.price}>${item.price}</span>

        {!reserved ? (
          <Button onClick={() => setReserved(true)}>Reserve</Button>
        ) : (
          <Button variant="secondary" disabled>
            Reserved
          </Button>
        )}
      </div>
    </div>
  );
}
