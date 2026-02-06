"use client";

import styles from "./TopNav.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Users, Heart, Search, Bell } from "lucide-react";

const navItems = [
  { label: "My Wishlists", href: "/home", icon: <Gift size={16} /> },
  { label: "Friends", href: "/friends", icon: <Users size={16} /> },
  { label: "Discover", href: "/discover", icon: <Heart size={16} /> },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Gift size={16} />
          </div>
          <span>Wishly</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className={styles.navItem}>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className={styles.activePill}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 32,
                    }}
                  />
                )}

                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className={styles.right}>
          <div className={styles.search}>
            <Search size={16} />
            <input placeholder="Search wishlists..." />
          </div>

          <div className={styles.notification}>
            <Bell size={18} />
            <span className={styles.badge}>3</span>
          </div>

          <div className={styles.avatar}>S</div>
        </div>
      </div>
    </header>
  );
}
