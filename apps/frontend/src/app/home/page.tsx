import { DashboardHeader } from "./components/DashboardHeader";
import { StatsRow } from "./components/StatsRow";
import { WishlistGrid } from "./components/WishlistGrid";

export default function HomePage() {
  return (
    <>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <DashboardHeader />
        <StatsRow />
        <WishlistGrid />
      </main>
    </>
  );
}
