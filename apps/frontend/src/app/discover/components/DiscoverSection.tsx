import styles from "./DiscoverSection.module.scss";
import { DiscoverItemCard } from "./DiscoverItemCard";
import { DiscoverSection as Section } from "@/lib/discover.mock";

export function DiscoverSection({
  owner,
  username,
  wishlist,
  date,
  items,
}: Section) {
  return (
    <section className={styles.section}>
      <header>
        <div>
          <strong>{owner}</strong> · {wishlist}
          <span>
            @{username}
            {date && ` · ${date}`}
          </span>
        </div>

        <button>View all</button>
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <DiscoverItemCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}
