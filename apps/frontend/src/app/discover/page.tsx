import { DiscoverHeader } from "./components/DiscoverHeader";
import { UpcomingEvents } from "./components/UpcomingEvents";
import { DiscoverFilters } from "./components/DiscoverFilters";
import { DiscoverSection } from "./components/DiscoverSection";
import { discoverSections } from "@/lib/discover.mock";

export default function DiscoverPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <DiscoverHeader />
      <UpcomingEvents />
      <DiscoverFilters />

      {discoverSections.map((section) => (
        <DiscoverSection key={section.id} {...section} />
      ))}
    </main>
  );
}
