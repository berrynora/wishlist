"use client";

import { useParams } from "next/navigation";
import { wishlistItemsMock } from "@/lib/wishlistItems.mock";
import { Button } from "@/components/ui/Button/Button";
import { useState } from "react";

export default function WishlistItemsPage() {
  const params = useParams();
  const id = params.id as string;

  const items = wishlistItemsMock[id] || [];

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontFamily: "var(--font-serif)", marginBottom: 24 }}>
        Wishlist Items
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 20,
        }}
      >
        {items.map((item) => (
          <WishlistItemCard key={item.id} {...item} />
        ))}
      </div>
    </main>
  );
}

function WishlistItemCard({
  title,
  price,
  reserved,
}: {
  title: string;
  price: number;
  reserved: boolean;
}) {
  const [isReserved, setReserved] = useState(reserved);

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 16,
        padding: 16,
        background: "white",
      }}
    >
      <strong>{title}</strong>
      <div style={{ color: "#c0267e", margin: "6px 0" }}>${price}</div>

      {!isReserved ? (
        <Button variant="success" onClick={() => setReserved(true)}>
          Reserve
        </Button>
      ) : (
        <Button variant="secondary" disabled>
          Reserved
        </Button>
      )}
    </div>
  );
}
