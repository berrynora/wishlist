"use client";

import { useMemo, useState } from "react";
import { DiscoverHeader } from "./components/DiscoverHeader";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { DiscoverFilters } from "./components/DiscoverFilters";
import { DiscoverSection } from "./components/DiscoverSection";
import { ReservedItemsGrid } from "./components/ReservedItemsGrid";
import {
  useFriendsWishlistsDiscover,
  useFriendsWishlistsReservedByMe,
} from "@/hooks/use-wishlists";
import { useToggleItemReservation } from "@/hooks/use-items";

export default function DiscoverPage() {
  const [filter, setFilter] = useState<"wishlists" | "reserved">("wishlists");

  const {
    data: wishlistsSections = [],
    isLoading: isWishlistsLoading,
    isError: isWishlistsError,
  } = useFriendsWishlistsDiscover();

  const {
    data: reservedSections = [],
    isLoading: isReservedLoading,
    isError: isReservedError,
  } = useFriendsWishlistsReservedByMe();

  const toggleReservation = useToggleItemReservation();

  const isLoading = filter === "wishlists" ? isWishlistsLoading : isReservedLoading;
  const isError = filter === "wishlists" ? isWishlistsError : isReservedError;
  const hasNoData =
    !isLoading && !isError &&
    (filter === "wishlists"
      ? wishlistsSections.length === 0
      : reservedSections.length === 0);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <DiscoverHeader />
      <UpcomingEvents />
      <DiscoverFilters active={filter} onChange={setFilter} />

      {isLoading && <p>Loading wishlists...</p>}
      {isError && <p>Failed to load wishlists.</p>}

      {hasNoData && (
        <p style={{ color: "#6b7280", textAlign: "center", marginTop: 32 }}>
          {filter === "reserved"
            ? "No reserved items yet."
            : "No wishlists to discover."}
        </p>
      )}

      {!isLoading && !isError && filter === "wishlists" &&
        wishlistsSections.map((section) => (
          <DiscoverSection
            key={section.id}
            {...section}
            onToggleReserve={(itemId) => toggleReservation.mutate(itemId)}
          />
        ))}

      {!isLoading && !isError && filter === "reserved" && (
        <ReservedItemsGrid
          items={reservedSections}
          onToggleReserve={(itemId) => toggleReservation.mutate(itemId)}
        />
      )}
    </main>
  );
}
