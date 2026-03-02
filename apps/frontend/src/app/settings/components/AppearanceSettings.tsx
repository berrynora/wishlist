"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import styles from "./AppearanceSettings.module.scss";
import { SettingsSection } from "./SettingsSection";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { WishlistAccent } from "@/types/wishlist";
import type { ThemePreference } from "@/types/settings";

const THEMES: {
  id: ThemePreference;
  label: string;
  icon: typeof Sun;
  description: string;
}[] = [
  {
    id: "light",
    label: "Light",
    icon: Sun,
    description: "Clean and bright",
  },
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    description: "Easy on the eyes",
  },
  {
    id: "system",
    label: "System",
    icon: Monitor,
    description: "Match your device",
  },
];

const ACCENTS: { id: WishlistAccent; label: string; cssClass: string }[] = [
  { id: WishlistAccent.Pink, label: "Pink", cssClass: "pink" },
  { id: WishlistAccent.Blue, label: "Blue", cssClass: "blue" },
  { id: WishlistAccent.Peach, label: "Peach", cssClass: "peach" },
  { id: WishlistAccent.Mint, label: "Mint", cssClass: "mint" },
  { id: WishlistAccent.Lavender, label: "Lavender", cssClass: "lavender" },
];

export function AppearanceSettings() {
  const { setTheme, theme: currentTheme } = useTheme();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  function handleTheme(theme: ThemePreference) {
    setTheme(theme);
    updateSettings.mutate({ theme });
  }

  function handleAccent(accent: WishlistAccent) {
    updateSettings.mutate({ default_accent: accent });
  }

  const activeAccent = settings?.default_accent ?? WishlistAccent.Pink;

  return (
    <>
      <SettingsSection
        title="Theme"
        description="Select your preferred color scheme."
      >
        <div className={styles.themeGrid}>
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isActive = currentTheme === t.id;

            return (
              <button
                key={t.id}
                type="button"
                className={`${styles.themeCard} ${isActive ? styles.active : ""}`}
                onClick={() => handleTheme(t.id)}
              >
                <div className={styles.themeIcon}>
                  <Icon size={22} />
                </div>
                <span className={styles.themeLabel}>{t.label}</span>
                <span className={styles.themeDesc}>{t.description}</span>
                {isActive && (
                  <div className={styles.themeCheck}>
                    <Check size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Default Accent Color"
        description="Pre-selected color when creating new wishlists."
      >
        <div className={styles.accentGrid}>
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`${styles.accentSwatch} ${styles[a.cssClass]} ${activeAccent === a.id ? styles.active : ""}`}
              onClick={() => handleAccent(a.id)}
              title={a.label}
            >
              {activeAccent === a.id && <Check size={16} />}
            </button>
          ))}
        </div>
        <p className={styles.accentLabel}>
          {ACCENTS.find((a) => a.id === activeAccent)?.label ?? "Pink"}
        </p>
      </SettingsSection>
    </>
  );
}
