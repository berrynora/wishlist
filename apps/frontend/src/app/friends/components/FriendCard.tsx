import styles from "./FriendCard.module.scss";

type Props = {
  name: string;
  username: string;
  wishlists: number;
  mutual: number;
};

export function FriendCard({ name, username, wishlists, mutual }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>👤</div>

      <div className={styles.info}>
        <strong>{name}</strong>
        <span>@{username}</span>
        <div className={styles.meta}>
          {wishlists} wishlists · {mutual} mutual
        </div>
      </div>

      <div className={styles.arrow}>›</div>
    </div>
  );
}
