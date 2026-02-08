"use client";

import { useState } from "react";
import { FriendsHeader } from "./components/FriendsHeader";
import { FriendsTabs } from "./components/FriendsTabs";
import { FriendCard } from "./components/FriendCard";
import { RequestCard } from "./components/RequestCard";
import {
  useAcceptFriendRequest,
  useFriends,
  useIncomingFriendRequests,
  useRejectFriendRequest,
} from "@/hooks/use-friends";

export default function FriendsPage() {
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const { data, isLoading, isError } = useFriends();
  const friends = data ?? [];
  const {
    data: requests,
    isLoading: requestsLoading,
    isError: requestsError,
  } = useIncomingFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <FriendsHeader />

      <FriendsTabs
        active={tab}
        friendsCount={friends.length}
        requestsCount={requests?.length ?? 0}
        onChange={setTab}
      />

      {tab === "friends" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {isLoading && <p>Loading...</p>}
          {isError && <p>Failed to load friends.</p>}
          {!isLoading && !isError && friends.length === 0 && (
            <p>No friends yet.</p>
          )}
          {friends.map((f) => (
            <FriendCard key={f.id} friend={f} />
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {requestsLoading && <p>Loading...</p>}
          {requestsError && <p>Failed to load requests.</p>}
          {!requestsLoading &&
            !requestsError &&
            (requests?.length ?? 0) === 0 && <p>No requests yet.</p>}
          {(requests ?? []).map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              onAccept={() => acceptRequest.mutate(r.id)}
              onReject={() => rejectRequest.mutate(r.id)}
              accepting={acceptRequest.isPending}
              rejecting={rejectRequest.isPending}
            />
          ))}
        </div>
      )}
    </main>
  );
}
