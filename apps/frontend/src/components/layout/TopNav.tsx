"use client";

import styles from "./TopNav.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Users, Heart, Search, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

const navItems = [
  { label: "My Wishlists", href: "/home", icon: <Gift size={16} /> },
  { label: "Friends", href: "/friends", icon: <Users size={16} /> },
  { label: "Discover", href: "/discover", icon: <Heart size={16} /> },
];

export function TopNav() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: "1", text: "Emma reserved an item 🎉", date: "2 min ago" },
    { id: "2", text: "James sent you a friend request", date: "1 hour ago" },
    { id: "3", text: "Birthday coming soon 🎂", date: "Yesterday" },
  ]);

  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Gift size={16} />
          </div>
          <span>Wishly</span>
        </div>

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

        <div className={styles.right}>
          <div className={styles.search}>
            <Search size={16} />
            <input placeholder="Search wishlists..." />
          </div>

          <div className={styles.notification} ref={ref}>
            <div
              className={styles.bell}
              onClick={() => setOpen((prev) => !prev)}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className={styles.badge}>{notifications.length}</span>
              )}
            </div>

            {open && (
              <NotificationsPanel
                notifications={notifications}
                onClear={() => setNotifications([])}
              />
            )}
          </div>

          <div className={styles.avatar}>S</div>
        </div>
      </div>
    </header>
  );
}
