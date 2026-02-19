"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsRow } from "./components/StatsRow";
import { WishlistGrid } from "./components/WishlistGrid";
import { CreateWishlistModal } from "@/app/wishlist/components/CreateWishlistModal";
import { FriendInviteModal } from "@/app/friends/components/FriendInviteModal";

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState<string>("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const inviteFromQuery = useMemo(
    () => searchParams.get("friendInvite") ?? "",
    [searchParams],
  );

  useEffect(() => {
    if (!inviteFromQuery) return;
    setInviteUserId(inviteFromQuery);
    setInviteOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("friendInvite");
    const next = params.toString();
    router.replace(next ? `/home?${next}` : "/home", { scroll: false });
  }, [inviteFromQuery, searchParams, router]);
  return (
    <>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <DashboardHeader onNewWishlist={() => setOpen(true)} />
        <StatsRow />
        <WishlistGrid />

        <CreateWishlistModal open={open} onClose={() => setOpen(false)} />
        <FriendInviteModal
          open={inviteOpen}
          userId={inviteUserId}
          onClose={() => setInviteOpen(false)}
        />
      </main>
    </>
  );
}
