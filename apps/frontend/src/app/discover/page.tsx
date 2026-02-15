"use client";

import { DiscoverHeader } from "./components/DiscoverHeader";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { DiscoverFilters } from "./components/DiscoverFilters";
import { DiscoverSection } from "./components/DiscoverSection";
import { useFriendsWishlistsDiscover } from "@/hooks/use-wishlists";

export default function DiscoverPage() {
  const {
    data: sections = [],
    isLoading,
    isError,
  } = useFriendsWishlistsDiscover();

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <DiscoverHeader />
      <UpcomingEvents />
      <DiscoverFilters />

      {isLoading && <p>Loading wishlists...</p>}
      {isError && <p>Failed to load wishlists.</p>}

      {!isLoading && !isError &&
        sections.map((section) => (
          <DiscoverSection key={section.id} {...section} />
        ))}
    </main>
  );
}
