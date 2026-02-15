"use client";

import { useState } from "react";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsRow } from "./components/StatsRow";
import { WishlistGrid } from "./components/WishlistGrid";
import { CreateWishlistModal } from "@/app/wishlist/components/CreateWishlistModal";

export default function HomePage() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <DashboardHeader onNewWishlist={() => setOpen(true)} />
        <StatsRow />
        <WishlistGrid />

        <CreateWishlistModal open={open} onClose={() => setOpen(false)} />
      </main>
    </>
  );
}
