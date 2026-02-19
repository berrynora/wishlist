"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Copy } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import styles from "./AddFriendModal.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddFriendModal({ open, onClose }: Props) {
  const [origin, setOrigin] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = useMemo(() => {
    if (!origin || !userId) return "";
    return `${origin}/home?friendInvite=${userId}`;
  }, [origin, userId]);

  useEffect(() => {
    setOrigin(window.location.origin);

    supabaseBrowser.auth
      .getUser()
      .then(({ data }) => {
        const id = data.user?.id;
        if (id) setUserId(id);
      })
      .catch(() => {
        setUserId("");
      });
  }, []);

  function handleCopy() {
    if (!inviteLink) return;
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
          <p className={styles.eyebrow}>Friends</p>
          <h2>Invite friends</h2>
          <p>Share your personal invite link or look up a friend by handle.</p>
        </div>

        {/* Invite Link */}
        <div className={styles.field}>
          <label>Your invite link</label>

          <div className={styles.linkWrapper}>
            <input value={inviteLink || "Loading..."} readOnly />

            <button
              className={styles.copyBtn}
              onClick={handleCopy}
              disabled={!inviteLink}
            >
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
