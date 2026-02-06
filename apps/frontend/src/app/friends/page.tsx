"use client";

import { useState } from "react";
import { friends, requests } from "@/lib/friends.mock";
import { FriendsHeader } from "./components/FriendsHeader";
import { FriendsTabs } from "./components/FriendsTabs";
import { FriendCard } from "./components/FriendCard";
import { RequestCard } from "./components/RequestCard";

export default function FriendsPage() {
  const [tab, setTab] = useState<"friends" | "requests">("friends");

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <FriendsHeader />

      <FriendsTabs
        active={tab}
        friendsCount={friends.length}
        requestsCount={requests.length}
        onChange={setTab}
      />

      {tab === "friends" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {friends.map((f) => (
            <FriendCard key={f.id} {...f} />
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {requests.map((r) => (
            <RequestCard key={r.id} {...r} />
          ))}
        </div>
      )}
    </main>
  );
}
