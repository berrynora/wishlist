import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeProduct, type ProductData } from "@/app/api/server/scrape-product/route";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string;
const CRON_SECRET = process.env.CRON_SECRET as string;

/**
 * Daily cron job that checks all items with URLs for discount changes.
 * Protected by CRON_SECRET header (Vercel cron sends this automatically).
 *
 * For each item with a URL:
 *   1. Scrapes the product page
 *   2. Updates price, discount_price, has_discount, discount_end_date
 *   3. Optionally updates the main price field
 */
export async function GET(request: NextRequest) {
  // ── Auth ──
  const authHeader = request.headers.get("Authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  function getEffectivePrice(product: ProductData): string | null {
    const effective = product.has_discount
      ? product.discount_price || product.price
      : product.price;
    return effective || null;
  }

  function isDuplicateKeyError(error: { code?: string; message?: string }) {
    return (
      error.code === "23505" ||
      /duplicate key value|unique constraint/i.test(error.message || "")
    );
  }

  // Fetch all items that have a non-null url
  const { data: items, error: fetchError } = await supabase
    .from("item")
    .select("id, url, price")
    .not("url", "is", null)
    .neq("url", "");

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch items", details: fetchError.message },
      { status: 500 }
    );
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ message: "No items with URLs found", updated: 0 });
  }

  let updated = 0;
  let failed = 0;
  const errors: { id: string; error: string }[] = [];

  let priceSnapshotsInserted = 0;
  let priceSnapshotsSkippedNoProduct = 0;
  let priceSnapshotsSkippedNoPrice = 0;
  let priceSnapshotsInsertFailed = 0;
  const priceSnapshotErrors: { id: string; error: string }[] = [];

  const skippedNoProduct: { id: string; url: string | null }[] = [];
  const skippedNoPrice: { id: string; url: string | null }[] = [];

  // Process items in batches of 5 to avoid overwhelming the server
  const BATCH_SIZE = 5;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const product = await scrapeProduct(item.url!);
          if (!product) {
            priceSnapshotsSkippedNoProduct++;
            if (skippedNoProduct.length < 20)
              skippedNoProduct.push({ id: item.id, url: item.url ?? null });
            return;
          }

          // Always write the full discount state so stale discounts get cleared
          const updateData: Record<string, unknown> = {
            has_discount: product.has_discount,
            discount_price: product.has_discount ? product.discount_price : null,
            discount_end_date: product.has_discount ? product.discount_end_date : null,
          };

          // Update the base price if scraped successfully
          if (product.price) {
            updateData.price = product.price;
          }

          const { error: updateError } = await supabase
            .from("item")
            .update(updateData)
            .eq("id", item.id);

          if (updateError) {
            throw new Error(updateError.message);
          }

          // Record price snapshot (lowest price: discount_price if present, else price)
          // Best-effort: do not fail the whole cron if this insert fails.
          const effectivePrice = getEffectivePrice(product);
          if (!effectivePrice) {
            priceSnapshotsSkippedNoPrice++;
            if (skippedNoPrice.length < 20)
              skippedNoPrice.push({ id: item.id, url: item.url ?? null });
          } else {
            const { error: insertError } = await supabase
              .from("item_prices_cumulative")
              .insert({
                item_id: item.id,
                price: effectivePrice,
              });

            if (insertError && !isDuplicateKeyError(insertError)) {
              priceSnapshotsInsertFailed++;
              priceSnapshotErrors.push({
                id: item.id,
                error: insertError.message,
              });
              console.warn(
                "[cron/check-discounts] Failed to insert price snapshot for item",
                item.id,
                insertError.message
              );
            } else if (!insertError) {
              priceSnapshotsInserted++;
            }
          }

          updated++;
        } catch (err) {
          failed++;
          errors.push({
            id: item.id,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      })
    );

    // Small delay between batches to be polite to external sites
    if (i + BATCH_SIZE < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({
    message: "Discount check complete",
    total: items.length,
    updated,
    failed,
    skipped: {
      no_product: skippedNoProduct.length > 0 ? skippedNoProduct : undefined,
      no_price: skippedNoPrice.length > 0 ? skippedNoPrice : undefined,
    },
    price_snapshots: {
      inserted: priceSnapshotsInserted,
      skipped_no_product: priceSnapshotsSkippedNoProduct,
      skipped_no_price: priceSnapshotsSkippedNoPrice,
      insert_failed: priceSnapshotsInsertFailed,
      errors: priceSnapshotErrors.length > 0 ? priceSnapshotErrors.slice(0, 20) : undefined,
    },
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
  });
}
