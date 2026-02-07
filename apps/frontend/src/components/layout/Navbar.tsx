"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.left}>MyApp</div>
      <div style={styles.right}>
        <Link href="/home">Home</Link>
        <Link href="/items">Items</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/login">Logout</Link>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid var(--border)",
    marginBottom: "2rem",
  },
  left: { fontWeight: 600 },
  right: { display: "flex", gap: "1rem" },
};
