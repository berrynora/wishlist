import styles from "./RequestCard.module.scss";

type Props = {
  name: string;
  username: string;
  mutual: number;
};

export function RequestCard({ name, username, mutual }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>👤</div>

      <div className={styles.info}>
        <strong>{name}</strong>
        <span>@{username}</span>
        <div className={styles.meta}>{mutual} mutual friends</div>
      </div>

      <div className={styles.actions}>
        <button className={styles.accept}>Accept</button>
        <button className={styles.decline}>Decline</button>
      </div>
    </div>
  );
}
