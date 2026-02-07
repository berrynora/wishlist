"use client";
import { useState } from "react";
import { ItemsHeader } from "./components/ItemsHeader";
import { ItemsTabs } from "./components/ItemsTabs";

interface Product {
  title: string | null;
  description: string | null;
  image: string | null;
  price: string | null;
  url?: string;
}

export default function ItemsPage() {
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<Product | null>(null); // Додайте тип тут
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"add" | "preview">("add");

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/server/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        setProduct(data);
        setTab("preview");
      } else {
        setError(data.error || "Помилка при завантаженні");
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      setError("Не вдалося отримати дані");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <ItemsHeader />

      <ItemsTabs
        active={tab}
        previewCount={product ? 1 : 0}
        onChange={setTab}
      />

      {tab === "add" && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Вставте посилання на товар"
              style={{
                border: "1px solid #e5e7eb",
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 14,
              }}
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url}
              style={{
                background: loading || !url ? "#e5e7eb" : "#c0267e",
                color: loading || !url ? "#9ca3af" : "#ffffff",
                border: "none",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 600,
                cursor: loading || !url ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Завантаження..." : "Отримати дані"}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: 12,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {tab === "preview" && (
        <div style={{ maxWidth: 640 }}>
          {!product && (
            <div
              style={{
                padding: "16px 18px",
                border: "1px dashed #e5e7eb",
                borderRadius: 14,
                color: "#6b7280",
                fontSize: 14,
              }}
            >
              Ще немає превʼю. Додайте посилання на товар.
            </div>
          )}

          {product && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              }}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.title || "Product"}
                  style={{ width: "100%", height: 280, objectFit: "cover" }}
                />
              )}
              <div style={{ padding: 18 }}>
                {product.title && (
                  <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                    {product.title}
                  </h2>
                )}
                {product.description && (
                  <p style={{ color: "#6b7280", marginBottom: 12 }}>
                    {product.description}
                  </p>
                )}
                {product.price && (
                  <p style={{ fontSize: 18, color: "#16a34a" }}>
                    {product.price}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
