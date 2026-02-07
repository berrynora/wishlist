import { wishlists } from "@/lib/dashboard.mock";
import { WishlistCard } from "./WishlistCard";
import styles from "./WishlistGrid.module.scss";

export function WishlistGrid() {
  return (
    <div>
      <h2 className={styles.title}>My Wishlists</h2>
      <div className={styles.grid}>
        {wishlists.map((w) => (
          <WishlistCard key={w.id} wishlist={w} />
        ))}
      </div>
    </div>
  );
}
