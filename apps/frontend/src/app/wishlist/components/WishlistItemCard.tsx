import styles from "./WishlistItemCard.module.scss";
import { Button } from "@/components/ui/Button/Button";
import { useState } from "react";
import { Item } from "@/types/item";

type Props = {
  item: Item;
};

export function WishlistItemCard({ item }: Props) {
  const [reserved, setReserved] = useState(Boolean(item.reserved_by));

  const hasImage = Boolean(item.image_url);
  const price = item.price || "";
  const title = item.name;

  return (
    <div className={styles.card}>
      <div className={styles.image}>
        {hasImage && (
          <img src={item.image_url as string} alt={title} />
        )}
      </div>

      <div className={styles.content}>
        <h3>{title}</h3>
        {price && <span className={styles.price}>{price}</span>}

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
