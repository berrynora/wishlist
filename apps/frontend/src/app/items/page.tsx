"use client";
import Navbar from "@/components/layout/Navbar";
import styles from "./items.module.scss";
import { useState } from "react";

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
    <>
      <Navbar />
      <main className="container">
        <div className="p-4 max-w-2xl mx-auto">
          <div className="space-y-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Вставте посилання на товар"
              className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleScrape}
              disabled={loading || !url}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? "Завантаження..." : "Отримати дані"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {product && (
            <div className="mt-6 border rounded-lg overflow-hidden shadow-lg">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.title || "Product"}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                {product.title && (
                  <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                )}
                {product.description && (
                  <p className="text-gray-600 mb-4">
                    Description: {product.description}</p>
                )}
                {product.price && (
                  <p className="text-2xl text-green-600 font-bold">
                    Price: {product.price}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
