"use client";

import styles from "./FriendsTabs.module.scss";

type Props = {
  active: "friends" | "requests";
  friendsCount: number;
  requestsCount: number;
  onChange: (v: "friends" | "requests") => void;
};

export function FriendsTabs({
  active,
  friendsCount,
  requestsCount,
  onChange,
}: Props) {
  return (
    <div className={styles.tabs}>
      <button
        className={active === "friends" ? styles.active : ""}
        onClick={() => onChange("friends")}
      >
        All Friends <span>{friendsCount}</span>
      </button>

      <button
        className={active === "requests" ? styles.active : ""}
        onClick={() => onChange("requests")}
      >
        Requests <span className={styles.badge}>{requestsCount}</span>
      </button>
    </div>
  );
}
