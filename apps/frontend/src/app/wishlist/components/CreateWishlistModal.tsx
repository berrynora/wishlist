"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Globe, Users, Lock, Check } from "lucide-react";
import styles from "./CreateWishlistModal.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateWishlistModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"Public" | "Friends" | "Private">(
    "Public",
  );
  const [color, setColor] = useState("pink");

  const colors = ["pink", "peach", "blue", "lavender", "mint"];

  function handleSubmit() {
    console.log({ name, description, privacy, color });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Create New Wishlist</h2>
            <p>Give your wishlist a name and customize its appearance.</p>
          </div>
        </div>

        {/* Name */}
        <div className={styles.field}>
          <label>Wishlist Name</label>
          <input
            placeholder="e.g. Birthday Wishes, Home Office Setup"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label>Description (optional)</label>
          <textarea
            placeholder="Add a note for your friends..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Privacy */}
        <div className={styles.section}>
          <label>Privacy</label>

          <div className={styles.privacyOptions}>
            <PrivacyCard
              icon={<Globe size={18} />}
              title="Public"
              subtitle="Anyone can view"
              selected={privacy === "Public"}
              onClick={() => setPrivacy("Public")}
            />

            <PrivacyCard
              icon={<Users size={18} />}
              title="Friends Only"
              subtitle="Only your friends"
              selected={privacy === "Friends"}
              onClick={() => setPrivacy("Friends")}
            />

            <PrivacyCard
              icon={<Lock size={18} />}
              title="Private"
              subtitle="Only you"
              selected={privacy === "Private"}
              onClick={() => setPrivacy("Private")}
            />
          </div>
        </div>

        {/* Colors */}
        <div className={styles.section}>
          <label>Cover Color</label>

          <div className={styles.colors}>
            {colors.map((c) => (
              <div
                key={c}
                className={`${styles.color} ${styles[c]} ${
                  color === c ? styles.active : ""
                }`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Create Wishlist
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PrivacyCard({ icon, title, subtitle, selected, onClick }: any) {
  return (
    <div
      className={`${styles.privacyCard} ${selected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <div className={styles.privacyIcon}>{icon}</div>

      <div>
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>

      {selected && (
        <div className={styles.check}>
          <Check size={16} />
        </div>
      )}
    </div>
  );
}
