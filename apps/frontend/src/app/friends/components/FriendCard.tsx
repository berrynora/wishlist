import styles from "./FriendCard.module.scss";
import type { FriendWithDetails } from "@/api/types/friends";

type Props = {
  friend: FriendWithDetails;
};

export function FriendCard({ friend }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>👤</div>

      <div className={styles.info}>
        <strong>{friend.display_name}</strong>
        {friend.nickname && <span>@{friend.nickname}</span>}
        <div className={styles.meta}>
          {friend.wishlists_count} wishlists · {friend.mutual_friends_count}{" "}
          mutual
        </div>
      </div>

      <div className={styles.arrow}>›</div>
    </div>
  );
}
