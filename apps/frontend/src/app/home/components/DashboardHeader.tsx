import styles from "./DashboardHeader.module.scss";

type Props = {
  onNewWishlist: () => void;
};

export function DashboardHeader({ onNewWishlist }: Props) {
  return (
    <div className={styles.header}>
      <div>
        <h1>Good afternoon, Sarah</h1>
        <p>
          Manage your wishlists and discover what your friends are wishing for.
        </p>
      </div>

      <button className={styles.button} onClick={onNewWishlist}>
        + New Wishlist
      </button>
    </div>
  );
}
