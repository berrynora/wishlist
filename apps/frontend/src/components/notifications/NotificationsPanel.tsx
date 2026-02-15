"use client";

import styles from "./NotificationsPanel.module.scss";
import { Button } from "@/components/ui/Button/Button";

type Notification = {
  id: string;
  text: string;
  date: string;
};

type Props = {
  notifications: Notification[];
  onClear: () => void;
};

export function NotificationsPanel({ notifications, onClear }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <strong>Notifications</strong>

        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>No notifications</div>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li key={n.id} className={styles.item}>
              <p>{n.text}</p>
              <span>{n.date}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
