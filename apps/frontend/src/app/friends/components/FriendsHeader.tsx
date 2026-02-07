import styles from "./FriendsHeader.module.scss";

export function FriendsHeader() {
  return (
    <div className={styles.header}>
      <div>
        <h1>Friends</h1>
        <p>Connect with friends and discover their wishlists.</p>
      </div>

      <button className={styles.button}>Invite Friends</button>
    </div>
  );
}
