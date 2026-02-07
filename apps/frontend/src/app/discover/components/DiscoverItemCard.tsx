import styles from "./DiscoverItemCard.module.scss";

type Props = {
  title: string;
  price: number;
  store: string;
  image: string;
  priority?: string;
};

export function DiscoverItemCard({
  title,
  price,
  store,
  image,
  priority,
}: Props) {
  return (
    <div className={styles.card}>
      {priority && <span className={styles.priority}>{priority}</span>}

      <img src={image} alt={title} />

      <div className={styles.info}>
        <strong>{title}</strong>
        <span>${price.toFixed(2)}</span>
        <small>{store}</small>

        <button>Reserve this gift</button>
      </div>
    </div>
  );
}
