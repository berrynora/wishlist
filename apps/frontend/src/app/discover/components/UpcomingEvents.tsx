import styles from "./UpcomingEvents.module.scss";
import { upcomingEvents } from "@/lib/discover.mock";

export function UpcomingEvents() {
  return (
    <div className={styles.card}>
      <div>
        <strong>{upcomingEvents.title}</strong>
        <p>{upcomingEvents.description}</p>
      </div>

      <div className={styles.dates}>
        {upcomingEvents.dates.map((d) => (
          <span key={d.name}>
            {d.name} · {d.date}
          </span>
        ))}
      </div>
    </div>
  );
}
