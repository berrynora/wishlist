"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Copy } from "lucide-react";
import styles from "./AddFriendModal.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddFriendModal({ open, onClose }: Props) {
  const inviteLink = "https://wishly.app/add/sarah_m";
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSearch() {
    if (!username.trim()) return;
    console.log("Search friend:", username);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Invite Friends</h2>
          <p>Share your unique link or search for friends on Wishly.</p>
        </div>

        {/* Invite Link */}
        <div className={styles.field}>
          <label>Your invite link</label>

          <div className={styles.linkWrapper}>
            <input value={inviteLink} readOnly />

            <button className={styles.copyBtn} onClick={handleCopy}>
              <Copy size={16} />
            </button>
          </div>

          {copied && <span className={styles.copied}>Copied to clipboard</span>}
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <span>OR SEARCH</span>
        </div>

        {/* Username Search */}
        <div className={styles.searchRow}>
          <div className={styles.usernameInput}>
            <input
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <Button onClick={handleSearch} disabled={!username.trim()}>
            Search
          </Button>
        </div>
      </div>
    </Modal>
  );
}
