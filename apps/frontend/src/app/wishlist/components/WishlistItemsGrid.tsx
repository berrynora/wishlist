import styles from "./WishlistItemsGrid.module.scss";
import { WishlistItemCard } from "./WishlistItemCard";

export function WishlistItemsGrid({ items }: any) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {items.map((item: any) => (
          <WishlistItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
