"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddFriendModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;

    console.log("Friend request sent to:", email);
    setEmail("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Friend">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, color: "#6b7280" }}>Friend Email</label>

          <Input
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={!email.trim()}>
            Send Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
