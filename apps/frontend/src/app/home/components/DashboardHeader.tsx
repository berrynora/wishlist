import styles from "./DashboardHeader.module.scss";

export function DashboardHeader() {
  return (
    <div className={styles.header}>
      <div>
        <h1>Good afternoon, Sarah</h1>
        <p>
          Manage your wishlists and discover what your friends are wishing for.
        </p>
      </div>

      <button className={styles.button}>+ New Wishlist</button>
    </div>
  );
}
