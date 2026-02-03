import Navbar from "@/components/layout/Navbar";
import styles from "./home.module.scss";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="container">
        <section className={styles.hero}>
          <div>
            <span className={styles.badge}>✨ Welcome back, Jessica!</span>
            <h1>
              Curate Your Dreams,
              <br />
              Share Your Wishes
            </h1>
            <p>
              Create beautiful wishlists, share them with friends, and discover
              what your loved ones truly desire.
            </p>

            <div className={styles.heroButtons}>
              <button className={styles.primaryBtn}>
                + Create New Wishlist
              </button>
              <button className={styles.secondaryBtn}>
                Explore Friends' Wishes →
              </button>
            </div>
          </div>
        </section>

        <section className={styles.statsRow}>
          <StatCard title="My Wishlists" value="8" color="purple" />
          <StatCard title="Friends" value="24" color="mint" />
          <StatCard title="Items Collected" value="56" color="peach" />
        </section>
      </main>
    </>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <div className={`card ${styles.statCard} ${styles[color]}`}>
      <div>
        <h2>{value}</h2>
        <p>{title}</p>
      </div>
    </div>
  );
}
