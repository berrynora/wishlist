import { stats } from "@/lib/dashboard.mock";
import { StatCard } from "./StatCard";
import styles from "./StatsRow.module.scss";

export function StatsRow() {
  return (
    <div className={styles.row}>
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
