"use client";

import { useMemo, useState } from "react";
import { DiscoverHeader } from "./components/DiscoverHeader";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { DiscoverFilters } from "./components/DiscoverFilters";
import { DiscoverSection } from "./components/DiscoverSection";
import { useFriendsWishlistsDiscover } from "@/hooks/use-wishlists";
import { useToggleItemReservation } from "@/hooks/use-items";

export default function DiscoverPage() {
  const [filter, setFilter] = useState<"wishlists" | "reserved">("wishlists");

  const {
    data: sections = [],
    isLoading,
    isError,
  } = useFriendsWishlistsDiscover();

  const toggleReservation = useToggleItemReservation();

  const filteredSections = useMemo(() => {
    if (filter === "wishlists") return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => item.isReserved,
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, filter]);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <DiscoverHeader />
      <UpcomingEvents />
      <DiscoverFilters active={filter} onChange={setFilter} />

      {isLoading && <p>Loading wishlists...</p>}
      {isError && <p>Failed to load wishlists.</p>}

      {!isLoading && !isError && filteredSections.length === 0 && (
        <p style={{ color: "#6b7280", textAlign: "center", marginTop: 32 }}>
          {filter === "reserved"
            ? "No reserved items yet."
            : "No wishlists to discover."}
        </p>
      )}

      {!isLoading &&
        !isError &&
        filteredSections.map((section) => (
          <DiscoverSection
            key={section.id}
            {...section}
            onToggleReserve={(itemId) => toggleReservation.mutate(itemId)}
          />
        ))}
    </main>
  );
}
