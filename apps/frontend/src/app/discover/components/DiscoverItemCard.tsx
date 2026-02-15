import styles from "./DiscoverItemCard.module.scss";
import { DiscoverItem } from "@/api/types/wishilst";

export function DiscoverItemCard({
  title,
  price,
  store,
  image,
  priority,
}: DiscoverItem) {
  return (
    <div className={styles.card}>
      {priority && <span className={styles.priority}>{priority}</span>}

      <img src={image} alt={title} />

      <div className={styles.info}>
        <strong>{title}</strong>
        <span>${price.toFixed(2)}</span>
        <small>{store}</small>

        <button>Reserve this gift</button>
      </div>
    </div>
  );
}
