import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export interface ProductData {
  title: string | null;
  description: string | null;
  image: string | null;
  price: string | null;
  discount_price: string | null;
  has_discount: boolean;
  discount_end_date: string | null;
}

type ScraperMethod = (html: string, url: string) => ProductData;

/**
 * Core scraping logic — fetches a URL and extracts product data.
 * Exported so the cron route can reuse it without HTTP overhead.
 */
export async function scrapeProduct(url: string): Promise<ProductData | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!response.ok) return null;

  const html = await response.text();

  // Спочатку перевіряємо специфічні парсери для відомих сайтів
  const siteSpecificResult = tryDomainSpecificScraper(html, url);
  if (siteSpecificResult.price) return siteSpecificResult;

  // Ланцюжок методів парсингу (від найспецифічнішого до найзагальнішого)
  const scrapers: ScraperMethod[] = [
    scrapeWithJSONLD,
    scrapeWithCheerio,
    scrapeWithRegex,
  ];

  const product: ProductData = {
    title: null,
    description: null,
    image: null,
    price: null,
    discount_price: null,
    has_discount: false,
    discount_end_date: null,
  };

  for (const scraper of scrapers) {
    const result = scraper(html, url);

    if (!product.title && result.title) product.title = result.title;
    if (!product.description && result.description)
      product.description = result.description;
    if (!product.image && result.image) product.image = result.image;
    if (!product.price && result.price) product.price = result.price;
    if (!product.discount_price && result.discount_price)
      product.discount_price = result.discount_price;
    if (!product.has_discount && result.has_discount)
      product.has_discount = result.has_discount;
    if (!product.discount_end_date && result.discount_end_date)
      product.discount_end_date = result.discount_end_date;

    if (
      product.title &&
      product.description &&
      product.image &&
      product.price
    ) {
      break;
    }
  }

  // If discount_price found but no base price, derive from discount_price
  if (product.discount_price && !product.price) {
    product.price = product.discount_price;
  }

  if (
    !product.title &&
    !product.description &&
    !product.image &&
    !product.price
  ) {
    return null;
  }

  return product;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    const product = await scrapeProduct(url);

    if (!product) {
      return NextResponse.json(
        { error: "Could not extract any product data" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to scrape",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// === DOMAIN-SPECIFIC SCRAPERS ===

function tryDomainSpecificScraper(html: string, url: string): ProductData {
  const domain = new URL(url).hostname.toLowerCase();

  if (domain.includes("rozetka.com.ua")) {
    return scrapeRozetka(html, url);
  } else if (domain.includes("epicentrk.ua")) {
    return scrapeEpicentr(html, url);
  } else if (domain.includes("foxtrot.com.ua")) {
    return scrapeFoxtrot(html, url);
  } else if (domain.includes("prom.ua")) {
    return scrapeProm(html, url);
  } else if (domain.includes("amazon.")) {
    return scrapeAmazon(html, url);
  } else if (domain.includes("ebay.")) {
    return scrapeEbay(html, url);
  } else if (domain.includes("olx.ua")) {
    return scrapeOLX(html, url);
  }

  return emptyProduct();
}

function emptyProduct(): ProductData {
  return {
    title: null,
    description: null,
    image: null,
    price: null,
    discount_price: null,
    has_discount: false,
    discount_end_date: null,
  };
}

function scrapeRozetka(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Rozetka: old price (перекреслена) = product-price__small
  //          current price (актуальна) = product-price__big
  const oldPriceText =
    $("p.product-price__small").text().trim() ||
    $(".product-price__small").text().trim() ||
    $('[class*="old-price"]').text().trim() ||
    $('[class*="price--old"]').text().trim();
  const currentPriceText =
    $("p.product-price__big").text().trim() ||
    $(".product-price__big").text().trim() ||
    $('[data-testid="price"]').text().trim() ||
    $('[class*="price"]').first().text().trim();

  const currentPrice = extractNumericPrice(currentPriceText) || extractPriceFromJSON(html);
  const oldPrice = extractNumericPrice(oldPriceText);

  const hasDiscount = Boolean(oldPrice && currentPrice && oldPrice !== currentPrice);

  // Discount end date (Rozetka sometimes shows promo timer)
  const promoEndText = $('[class*="promo-end"], [class*="timer"], [data-testid="promotion-end"]').text().trim();
  const discountEndDate = extractDateFromText(promoEndText);

  return {
    title: $("h1.product__title").text().trim() || extractTitle($),
    description: extractDescription($),
    image:
      $('meta[property="og:image"]').attr("content") || extractImage($, url),
    price: hasDiscount ? oldPrice : currentPrice,
    discount_price: hasDiscount ? currentPrice : null,
    has_discount: hasDiscount,
    discount_end_date: discountEndDate,
  };
}

function scrapeEpicentr(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Epicentr HTML structure:
  //   .product-box__main_discount > span "-6 200 грн" (discount AMOUNT — ignore!)
  //                                label "15 199"     (old/original price)
  //   .product-box__main_price   "8 999 ₴"            (current/sale price)
  //
  // Also has <data> elements with value attributes for prices.
  // IMPORTANT: the discount badge shows the DIFFERENCE, not the old price.

  let oldPrice: string | null = null;
  let currentPrice: string | null = null;

  // 1. Epicentr-specific selectors (most reliable)
  //    Current/sale price: .product-box__main_price
  const mainPriceText = $(".product-box__main_price").text().trim();
  if (mainPriceText) {
    currentPrice = extractNumericPrice(mainPriceText);
  }

  //    Old/original price: .product-box__main_discount > label
  const discountLabel = $(".product-box__main_discount label").text().trim();
  if (discountLabel) {
    oldPrice = extractNumericPrice(discountLabel);
  }

  // 2. Fallback: <del>/<s> with data[value] for old price
  if (!oldPrice) {
    $('del, s, [style*="line-through"]').each((_, el) => {
      if (oldPrice) return;
      // Try data[value] inside first
      const dataEl = $(el).find('data[value]').first();
      if (dataEl.length) {
        const val = dataEl.attr('value');
        if (val) {
          const p = extractNumericPrice(val);
          if (p) { oldPrice = p; return; }
        }
      }
      const text = $(el).text().trim();
      const price = extractNumericPrice(text);
      if (price && parseFloat(price.replace(/[^\d.]/g, "")) > 0) {
        oldPrice = price;
      }
    });
  }

  // 3. Fallback: data elements with itemprop="price" not inside discount badge
  if (!currentPrice) {
    $('[itemprop="price"]').each((_, el) => {
      if (currentPrice) return;
      // Skip if inside a <del>/<s> (that's the old price)
      if ($(el).closest('del, s, [style*="line-through"]').length > 0) return;
      const val = $(el).attr('content') || $(el).attr('value');
      if (val) {
        const p = extractNumericPrice(val);
        if (p) currentPrice = p;
      }
    });
  }

  // 4. JSON-LD fallback
  if (!currentPrice) {
    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_, el) => {
      if (currentPrice) return;
      try {
        const json = JSON.parse($(el).text());
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item["@type"] === "Product" && item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offer.price) {
              currentPrice = currentPrice || extractNumericPrice(String(offer.price));
            }
          }
        }
      } catch { /* ignore */ }
    });
  }

  // 5. Regex fallback for "8 580 ₴" pattern
  if (!currentPrice) {
    const priceMatch = html.match(/(\d[\d\s]*\d)\s*₴/i);
    if (priceMatch) {
      currentPrice = extractNumericPrice(priceMatch[1]);
    }
  }

  // 6. Validate: oldPrice must be > currentPrice
  if (oldPrice && currentPrice) {
    const oldNum = parseFloat(oldPrice.replace(/[^\d.]/g, ""));
    const curNum = parseFloat(currentPrice.replace(/[^\d.]/g, ""));
    if (oldNum < curNum) {
      [oldPrice, currentPrice] = [currentPrice, oldPrice];
    }
    if (oldNum === curNum) {
      oldPrice = null;
    }
  }

  const hasDiscount = Boolean(oldPrice && currentPrice && oldPrice !== currentPrice);

  return {
    title: $("h1").first().text().trim() || extractTitle($),
    description: extractDescription($),
    image:
      $('meta[property="og:image"]').attr("content") || extractImage($, url),
    price: hasDiscount ? oldPrice : currentPrice,
    discount_price: hasDiscount ? currentPrice : null,
    has_discount: hasDiscount,
    discount_end_date: null,
  };
}

function scrapeFoxtrot(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Foxtrot HTML structure:
  //   <s data-product-price-old>
  //     <data content="25999.00" value="25999.00" itemprop="price">25 999</data>
  //   </s>
  //   <small data-discount-badge>  ← discount AMOUNT (difference), IGNORE
  //     -<data value="8000.00">8 000</data> ₴
  //   </small>
  //   <div data-product-price-main>
  //     <data value="17999.00" itemprop="price" data-testid="product-main-price">17 999</data>
  //     <data value="UAH">₴/шт.</data>
  //   </div>

  let oldPrice: string | null = null;
  let currentPrice: string | null = null;
  let discountEndDate: string | null = null;

  // 1. Current/sale price from [data-product-price-main]
  const mainPriceEl = $('[data-product-price-main]');
  if (mainPriceEl.length) {
    // Try data[value] inside first
    const dataEl = mainPriceEl.find('data[value]').first();
    if (dataEl.length) {
      const val = dataEl.attr('value') || dataEl.attr('content');
      if (val) currentPrice = extractNumericPrice(val);
    }
    if (!currentPrice) {
      currentPrice = extractNumericPrice(mainPriceEl.text().trim());
    }
  }

  // 2. Old price from <s data-product-price-old> or [data-product-price-old]
  const oldPriceEl = $('[data-product-price-old]');
  if (oldPriceEl.length) {
    const dataEl = oldPriceEl.find('data[value]').first();
    if (dataEl.length) {
      const val = dataEl.attr('value') || dataEl.attr('content');
      if (val) oldPrice = extractNumericPrice(val);
    }
    if (!oldPrice) {
      oldPrice = extractNumericPrice(oldPriceEl.text().trim());
    }
  }

  // 3. priceValidUntil from meta inside the price block
  const validUntil = $('[itemprop="priceValidUntil"]').attr('content');
  if (validUntil) {
    discountEndDate = validUntil.split('T')[0]; // "2026-03-4T00:00:00.000Z" → "2026-03-4"
  }

  // 4. Fallback: product-box__main selectors (older Foxtrot layout)
  if (!currentPrice) {
    const boxPrice = $(".product-box__main_price").text().trim();
    if (boxPrice) currentPrice = extractNumericPrice(boxPrice);
  }
  if (!oldPrice) {
    const boxOldLabel = $(".product-box__main_discount label").text().trim();
    if (boxOldLabel) oldPrice = extractNumericPrice(boxOldLabel);
  }

  // 5. Fallback: data-rewish-price attribute
  if (!currentPrice) {
    const rewishPrice = $('[data-rewish-price]').attr('data-rewish-price');
    if (rewishPrice) currentPrice = extractNumericPrice(rewishPrice);
  }

  // 6. Fallback: Schema.org microdata (itemprop="price" NOT inside <s>)
  if (!currentPrice) {
    $('[itemprop="price"]').each((_, el) => {
      if (currentPrice) return;
      if ($(el).closest('s, del, [data-product-price-old]').length > 0) return;
      const val = $(el).attr('content') || $(el).attr('value');
      if (val) {
        const p = extractNumericPrice(val);
        if (p) currentPrice = p;
      }
    });
  }

  // 7. Validate
  if (oldPrice && currentPrice) {
    const oldNum = parseFloat(oldPrice.replace(/[^\d.]/g, ""));
    const curNum = parseFloat(currentPrice.replace(/[^\d.]/g, ""));
    if (oldNum < curNum) {
      [oldPrice, currentPrice] = [currentPrice, oldPrice];
    }
    if (oldNum === curNum) {
      oldPrice = null;
    }
  }

  const hasDiscount = Boolean(oldPrice && currentPrice && oldPrice !== currentPrice);

  return {
    title: $("h1").first().text().trim() || extractTitle($),
    description: extractDescription($),
    image:
      $('meta[property="og:image"]').attr("content") || extractImage($, url),
    price: hasDiscount ? oldPrice : currentPrice,
    discount_price: hasDiscount ? currentPrice : null,
    has_discount: hasDiscount,
    discount_end_date: discountEndDate,
  };
}

function scrapeProm(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Prom.ua HTML structure:
  //   [data-qaid="product_price"] data-qaprice="473.90"  — current/sale price
  //   [data-qaid="old_price"]     data-qaprice="677"     — old/original price
  // Also has text content: "473.90 ₴" / "677 ₴"

  let currentPrice: string | null = null;
  let oldPrice: string | null = null;

  // 1. data-qaprice attributes (most reliable — clean numeric values)
  const currentPriceAttr = $('[data-qaid="product_price"]').attr('data-qaprice');
  if (currentPriceAttr) {
    currentPrice = extractNumericPrice(currentPriceAttr);
  }

  const oldPriceAttr = $('[data-qaid="old_price"]').attr('data-qaprice');
  if (oldPriceAttr) {
    oldPrice = extractNumericPrice(oldPriceAttr);
  }

  // 2. Fallback: text content from the same elements
  if (!currentPrice) {
    const currentPriceText =
      $('[data-qaid="product_price"]').text().trim() ||
      $(".product-price").text().trim();
    currentPrice = extractNumericPrice(currentPriceText);
  }

  if (!oldPrice) {
    const oldPriceText =
      $('[data-qaid="old_price"]').text().trim() ||
      $('[data-qaid="product_old_price"]').text().trim() ||
      $('[class*="old-price"], [class*="old_price"]').text().trim();
    oldPrice = extractNumericPrice(oldPriceText);
  }

  // 3. JSON-LD / JSON fallback
  if (!currentPrice) {
    currentPrice = extractPriceFromJSON(html);
  }

  // 4. Validate
  if (oldPrice && currentPrice) {
    const oldNum = parseFloat(oldPrice.replace(/[^\d.]/g, ""));
    const curNum = parseFloat(currentPrice.replace(/[^\d.]/g, ""));
    if (oldNum < curNum) {
      [oldPrice, currentPrice] = [currentPrice, oldPrice];
    }
    if (oldNum === curNum) {
      oldPrice = null;
    }
  }

  const hasDiscount = Boolean(oldPrice && currentPrice && oldPrice !== currentPrice);

  return {
    title: $("h1").first().text().trim() || extractTitle($),
    description: extractDescription($),
    image: extractImage($, url),
    price: hasDiscount ? oldPrice : currentPrice,
    discount_price: hasDiscount ? currentPrice : null,
    has_discount: hasDiscount,
    discount_end_date: null,
  };
}

function scrapeAmazon(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Amazon: deal price vs list price
  const dealPriceText =
    $(".a-price .a-offscreen").first().text().trim() ||
    $("#priceblock_dealprice").text().trim();
  const listPriceText =
    $(".a-text-price .a-offscreen").first().text().trim() ||
    $("#priceblock_ourprice").text().trim() ||
    $('[data-a-strike="true"] .a-offscreen').first().text().trim();

  const dealPrice = extractNumericPrice(dealPriceText);
  const listPrice = extractNumericPrice(listPriceText);
  const currentPrice = dealPrice || listPrice || extractNumericPrice($(".a-price-whole").first().text().trim()) || extractPriceFromJSON(html);

  const hasDiscount = Boolean(listPrice && dealPrice && listPrice !== dealPrice);

  // Amazon promo end date
  const promoEndText = $('[class*="deal-end"], [class*="countdown"]').text().trim();
  const discountEndDate = extractDateFromText(promoEndText);

  return {
    title: $("#productTitle").text().trim() || extractTitle($),
    description: extractDescription($),
    image: $("#landingImage").attr("src") || extractImage($, url),
    price: hasDiscount ? listPrice : currentPrice,
    discount_price: hasDiscount ? dealPrice : null,
    has_discount: hasDiscount,
    discount_end_date: discountEndDate,
  };
}

function scrapeEbay(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // eBay current layout:
  //   .x-price-primary → current/sale price: "US $503.99/ea"
  //   .ux-textspans--STRIKETHROUGH → old price: "US $603.99" (inside .x-additional-info)
  //   .x-additional-info__item--1 → savings: "Save US $100.00 (17% off)" — IGNORE
  //
  // Legacy layout:
  //   .x-price-primary → current price
  //   .x-price-was → old/was price

  // Current/sale price
  const currentPriceText =
    $(".x-price-primary").text().trim() ||
    $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim();

  // Old/original price — try multiple selectors for different eBay layouts
  const oldPriceText =
    $(".x-price-primary").parent().find(".ux-textspans--STRIKETHROUGH").text().trim() ||
    $(".x-additional-info .ux-textspans--STRIKETHROUGH").text().trim() ||
    $('[class*="STRIKETHROUGH"]').first().text().trim() ||
    $(".x-price-was").text().trim();

  const currentPrice = extractNumericPrice(currentPriceText) || extractPriceFromJSON(html);
  const oldPrice = extractNumericPrice(oldPriceText);

  // Validate: old must be > current
  let finalOld = oldPrice;
  let finalCurrent = currentPrice;
  if (finalOld && finalCurrent) {
    const oldNum = parseFloat(finalOld.replace(/[^\d.]/g, ""));
    const curNum = parseFloat(finalCurrent.replace(/[^\d.]/g, ""));
    if (oldNum < curNum) {
      [finalOld, finalCurrent] = [finalCurrent, finalOld];
    }
    if (oldNum === curNum) {
      finalOld = null;
    }
  }

  const hasDiscount = Boolean(finalOld && finalCurrent && finalOld !== finalCurrent);

  return {
    title: $("h1.x-item-title__mainTitle").text().trim() || extractTitle($),
    description: extractDescription($),
    image: extractImage($, url),
    price: hasDiscount ? finalOld : finalCurrent,
    discount_price: hasDiscount ? finalCurrent : null,
    has_discount: hasDiscount,
    discount_end_date: null,
  };
}

function scrapeOLX(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const priceText =
    $('[data-testid="ad-price-container"]').text().trim() ||
    $(".css-90xrc0").text().trim();

  const price = extractNumericPrice(priceText) || extractPriceFromJSON(html);

  return {
    title: $('[data-cy="ad_title"]').text().trim() || extractTitle($),
    description: extractDescription($),
    image: extractImage($, url),
    price: price,
    discount_price: null,
    has_discount: false,
    discount_end_date: null,
  };
}

// === GENERIC SCRAPERS ===

// Метод 1: JSON-LD (найнадійніший для ціни)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scrapeWithJSONLD(html: string, _url: string): ProductData {
  try {
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (!jsonLdMatch) {
      return emptyProduct();
    }

    for (const script of jsonLdMatch) {
      const jsonContent = script
        .replace(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i,
          ""
        )
        .replace(/<\/script>/i, "");

      try {
        const data = JSON.parse(jsonContent);

        const result = extractProductFromJSONLD(data);
        if (result) return result;
      } catch {
        continue;
      }
    }

    return emptyProduct();
  } catch (error) {
    console.error("JSON-LD scraping failed:", error);
    return emptyProduct();
  }
}

// Рекурсивне витягування Product з JSON-LD (@graph, priceSpecification, AggregateOffer)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProductFromJSONLD(data: any): ProductData | null {
  if (!data || typeof data !== "object") return null;

  // Handle @graph structure (WordPress/WooCommerce, Shopify)
  if (data["@graph"]) {
    const graphItems = Array.isArray(data["@graph"])
      ? data["@graph"]
      : [data["@graph"]];
    for (const item of graphItems) {
      const result = extractProductFromJSONLD(item);
      if (result) return result;
    }
  }

  const items = Array.isArray(data) ? data : [data];

  for (const item of items) {
    const itemType = item["@type"];
    const isProduct =
      itemType === "Product" ||
      itemType === "http://schema.org/Product" ||
      (Array.isArray(itemType) && itemType.includes("Product"));

    if (!isProduct) continue;

    const offers = item.offers;
    let price: string | null = null;
    let discountPrice: string | null = null;
    let hasDiscount = false;
    let discountEndDate: string | null = null;

    if (offers) {
      const offersList = Array.isArray(offers) ? offers : [offers];

      for (const offer of offersList) {
        // --- AggregateOffer ---
        if (
          offer["@type"] === "AggregateOffer" ||
          offer["@type"] === "http://schema.org/AggregateOffer"
        ) {
          if (offer.lowPrice != null) {
            if (
              offer.highPrice != null &&
              String(offer.highPrice) !== String(offer.lowPrice)
            ) {
              price = String(offer.highPrice);
              discountPrice = String(offer.lowPrice);
              hasDiscount = true;
            } else {
              price = String(offer.lowPrice);
            }
          } else if (offer.price != null) {
            price = String(offer.price);
          }
          if (offer.priceValidUntil) discountEndDate = offer.priceValidUntil;
          break;
        }

        // --- PriceSpecification (detailed price types) ---
        if (offer.priceSpecification) {
          const specs = Array.isArray(offer.priceSpecification)
            ? offer.priceSpecification
            : [offer.priceSpecification];

          let listPrice: string | null = null;
          let salePrice: string | null = null;

          for (const spec of specs) {
            const specPrice = spec.price ?? spec.value;
            if (specPrice == null) continue;

            const specType = (
              spec["@type"] ||
              spec.priceType ||
              ""
            ).toString();

            if (
              /ListPrice|MSRP|RegularPrice|SuggestedRetailPrice/i.test(
                specType
              ) ||
              /list|regular|original|retail|msrp|rrp|base|normal/i.test(
                specType
              )
            ) {
              listPrice = String(specPrice);
            } else if (
              /SalePrice|MinimumAdvertisedPrice|DiscountPrice|PromotionalPrice/i.test(
                specType
              ) ||
              /sale|special|offer|discount|deal|promo|reduced|clearance/i.test(
                specType
              )
            ) {
              salePrice = String(specPrice);
            } else if (!salePrice) {
              salePrice = String(specPrice);
            }

            if (spec.validThrough || spec.priceValidUntil) {
              discountEndDate =
                discountEndDate || spec.validThrough || spec.priceValidUntil;
            }
          }

          if (listPrice && salePrice && listPrice !== salePrice) {
            price = listPrice;
            discountPrice = salePrice;
            hasDiscount = true;
          } else {
            price = salePrice || listPrice;
          }
        }

        // --- Standard offer price ---
        const offerPrice = offer.price ?? offer.lowPrice;
        if (!price && offerPrice != null) {
          price = String(offerPrice);
        }

        // --- highPrice vs price comparison ---
        if (!hasDiscount && offer.price != null && offer.highPrice != null) {
          const p = parseFloat(String(offer.price));
          const hp = parseFloat(String(offer.highPrice));
          if (!isNaN(p) && !isNaN(hp) && p !== hp) {
            price = String(Math.max(p, hp));
            discountPrice = String(Math.min(p, hp));
            hasDiscount = true;
          }
        }

        // --- Non-standard salePrice property (used by some CMS) ---
        if (
          !hasDiscount &&
          offer.salePrice != null &&
          offerPrice != null
        ) {
          const sp = parseFloat(String(offer.salePrice));
          const op = parseFloat(String(offerPrice));
          if (!isNaN(sp) && !isNaN(op) && sp !== op) {
            price = String(Math.max(sp, op));
            discountPrice = String(Math.min(sp, op));
            hasDiscount = true;
          }
        }

        if (offer.priceValidUntil) {
          discountEndDate = discountEndDate || offer.priceValidUntil;
        }

        // Use first valid offer
        if (price) break;
      }
    }

    // Validate: ensure price > discountPrice
    if (hasDiscount && price && discountPrice) {
      const priceNum = parseFloat(String(price).replace(/[^\d.]/g, ""));
      const discountNum = parseFloat(
        String(discountPrice).replace(/[^\d.]/g, "")
      );
      if (!isNaN(priceNum) && !isNaN(discountNum)) {
        if (discountNum > priceNum) {
          [price, discountPrice] = [discountPrice, price];
        } else if (discountNum === priceNum) {
          discountPrice = null;
          hasDiscount = false;
        }
      }
    }

    return {
      title: item.name || null,
      description: item.description || null,
      image:
        (Array.isArray(item.image) ? item.image[0] : item.image) || null,
      price: price ? String(price) : null,
      discount_price: discountPrice ? String(discountPrice) : null,
      has_discount: hasDiscount,
      discount_end_date: discountEndDate,
    };
  }

  return null;
}

// Метод 2: Cheerio з покращеним парсингом ціни
function scrapeWithCheerio(html: string, url: string): ProductData {
  try {
    const $ = cheerio.load(html);

    const { currentPrice, oldPrice, discountEndDate } = extractPricesAdvanced($, html);
    const hasDiscount = Boolean(oldPrice && currentPrice && oldPrice !== currentPrice);

    return {
      title: extractTitle($),
      description: extractDescription($),
      image: extractImage($, url),
      price: hasDiscount ? oldPrice : currentPrice,
      discount_price: hasDiscount ? currentPrice : null,
      has_discount: hasDiscount,
      discount_end_date: discountEndDate,
    };
  } catch (error) {
    console.error("Cheerio scraping failed:", error);
    return emptyProduct();
  }
}

// Метод 3: Regex (запасний варіант)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scrapeWithRegex(html: string, _url: string): ProductData {
  try {
    return {
      title:
        extractMetaTagRegex(html, "og:title") || extractTagRegex(html, "h1"),
      description:
        extractMetaTagRegex(html, "og:description") ||
        extractMetaTagRegex(html, "description"),
      image: extractMetaTagRegex(html, "og:image"),
      price: extractPriceRegex(html),
      discount_price: null,
      has_discount: false,
      discount_end_date: null,
    };
  } catch (error) {
    console.error("Regex scraping failed:", error);
    return emptyProduct();
  }
}

// === PRICE EXTRACTION HELPERS ===

// Перевіряє чи елемент є discount badge (показує різницю "-8 000 ₴", а не реальну ціну)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isDiscountBadge($: cheerio.CheerioAPI, el: any): boolean {
  const $el = $(el);

  // Check data attributes
  if (
    $el.attr('data-discount-badge') !== undefined ||
    $el.attr('data-product-price-badge') !== undefined
  ) {
    return true;
  }

  // Check class names
  const className = ($el.attr('class') || '').toLowerCase();
  if (
    /discount[-_]?badge|badge[-_]?discount|price[-_]?badge|savings[-_]?badge|save[-_]?badge/.test(className)
  ) {
    return true;
  }

  // Check if text starts with minus sign (like "-8 000 ₴" or "−6 200 грн")
  const text = $el.text().trim();
  if (/^[-−–]\s*\d/.test(text)) {
    return true;
  }

  // Check for "Save $X" / "Save X%" / "Savings" / "Економія" patterns
  if (/^save\b|^savings\b|^you save\b|^економія|^знижка|^вигода/i.test(text)) {
    return true;
  }

  return false;
}

// Валідація пари цін (старша > поточна, swap якщо потрібно)
function validatePricePair(
  oldPrice: string | null,
  currentPrice: string | null
): { oldPrice: string | null; currentPrice: string | null } {
  if (!oldPrice || !currentPrice) return { oldPrice, currentPrice };

  const oldNum = parseFloat(oldPrice.replace(/[^\d.]/g, ""));
  const curNum = parseFloat(currentPrice.replace(/[^\d.]/g, ""));

  if (isNaN(oldNum) || isNaN(curNum)) return { oldPrice, currentPrice };

  if (oldNum < curNum) {
    return { oldPrice: currentPrice, currentPrice: oldPrice };
  }
  if (oldNum === curNum) {
    return { oldPrice: null, currentPrice };
  }

  return { oldPrice, currentPrice };
}

// Знаходить пару "стара ціна / нова ціна" з DOM-структури
function extractPricePairFromDOM($: cheerio.CheerioAPI): {
  oldPrice: string | null;
  currentPrice: string | null;
} {
  let oldPrice: string | null = null;
  let currentPrice: string | null = null;

  const strikethroughSelector =
    'del, s, [style*="line-through"], [class*="line-through"], [class*="strikethrough"], ' +
    '[class*="STRIKETHROUGH"], [class*="linethrough"], [class*="crossed-out"], ' +
    '[class*="text-decoration-line-through"]';

  // --- Стратегія 1: WooCommerce / CMS pattern: del + ins всередині price контейнера ---
  const priceContainers = $(
    'p.price, .price, .product-price, [class*="price-box"], [class*="priceBox"], ' +
    '[class*="price-wrapper"], [class*="priceWrapper"], [class*="price-container"], ' +
    '[class*="priceContainer"], [class*="price-block"], [class*="priceBlock"], ' +
    '[class*="bin-price"], [class*="price-info"], [class*="priceInfo"]'
  );

  priceContainers.each((_, container) => {
    if (oldPrice && currentPrice) return;
    // Try del + ins pattern first
    const delEl = $(container).find("del, s").first();
    const insEl = $(container).find("ins").first();

    if (delEl.length && insEl.length) {
      const op = extractNumericPrice(delEl.text().trim());
      const np = extractNumericPrice(insEl.text().trim());
      if (op && np && op !== np) {
        oldPrice = op;
        currentPrice = np;
        return;
      }
    }

    // Try: strikethrough class element + non-strikethrough sibling with price
    const strikeEl = $(container).find(
      '[class*="STRIKETHROUGH"], [class*="strikethrough"], [class*="line-through"], ' +
      '[style*="line-through"], del, s'
    ).first();

    if (strikeEl.length) {
      const op = extractNumericPrice(strikeEl.text().trim());
      if (!op) return;

      // Find the primary price element (not strikethrough, not savings badge)
      $(container).find('[class*="price"], [class*="amount"], span').each((_, priceEl) => {
        if (currentPrice) return;
        const $priceEl = $(priceEl);
        // Skip if it IS the strikethrough element or contains it
        if ($priceEl.is(strikeEl) || $priceEl.find(strikeEl).length > 0) return;
        // Skip if inside a strikethrough parent
        if ($priceEl.closest('del, s, [class*="STRIKETHROUGH"], [class*="strikethrough"], [style*="line-through"]').length > 0) return;
        // Skip savings badges
        if (isDiscountBadge($, priceEl)) return;
        // Skip if no digits
        const priceText = $priceEl.text().trim();
        if (!priceText || !/\d/.test(priceText)) return;
        const np = extractNumericPrice(priceText);
        if (np && np !== op) {
          oldPrice = op;
          currentPrice = np;
        }
      });
    }
  });

  if (oldPrice && currentPrice) return validatePricePair(oldPrice, currentPrice);

  // --- Стратегія 2: Знайти <del>/<s> з ціною і шукати нову ціну поруч ---
  $(strikethroughSelector).each((_, el) => {
    if (oldPrice && currentPrice) return;

    const text = $(el).text().trim();
    if (!/\d/.test(text)) return;

    const extractedOld = extractNumericPrice(text);
    if (!extractedOld) return;

    // A) <ins> sibling (WooCommerce pattern)
    const insEl = $(el).siblings("ins").first();
    if (insEl.length) {
      const np = extractNumericPrice(insEl.text().trim());
      if (np && np !== extractedOld) {
        oldPrice = extractedOld;
        currentPrice = np;
        return;
      }
    }

    // B) інші сиблінги (не del/s, не strikethrough, не discount badge)
    $(el)
      .siblings()
      .each((_, sib) => {
        if (currentPrice) return;
        if ($(sib).is("del, s") || $(sib).find("del, s").length > 0) return;
        const sibStyle = $(sib).attr("style") || "";
        if (sibStyle.includes("line-through")) return;
        // Skip discount badges (show difference amount like "-8 000 ₴")
        if (isDiscountBadge($, sib)) return;

        const sibText = $(sib).text().trim();
        if (sibText && /\d/.test(sibText)) {
          const np = extractNumericPrice(sibText);
          if (np && np !== extractedOld) {
            oldPrice = extractedOld;
            currentPrice = np;
          }
        }
      });

    if (currentPrice) return;

    // C) текст батьківського елемента без del/s та discount badges
    const parent = $(el).parent();
    const parentClone = parent.clone();
    parentClone.find(strikethroughSelector).remove();
    parentClone.find('[data-discount-badge], [class*="discount-badge"], [class*="discount_badge"]').remove();
    const remainingText = parentClone.text().trim();
    if (remainingText && /\d/.test(remainingText)) {
      // Extract but skip if it looks like a discount diff (starts with -)
      const cleanedRemaining = remainingText.replace(/^[-−–]\s*/, '');
      const np = extractNumericPrice(cleanedRemaining);
      if (np && np !== extractedOld) {
        oldPrice = extractedOld;
        currentPrice = np;
        return;
      }
    }

    // D) підняти на рівень вище (grandparent) і шукати ціну
    const grandparent = parent.parent();
    if (grandparent.length) {
      const gpClone = grandparent.clone();
      gpClone.find(strikethroughSelector).remove();
      gpClone.find('[data-discount-badge], [class*="discount-badge"], [class*="discount_badge"]').remove();

      // Шукати в дочірніх елементах
      gpClone.children().each((_, child) => {
        if (currentPrice) return;
        // Skip discount badges in grandparent children
        if (isDiscountBadge($, child)) return;
        const childText = $(child).text().trim();
        if (childText && /\d/.test(childText)) {
          const np = extractNumericPrice(childText);
          if (np && np !== extractedOld) {
            oldPrice = extractedOld;
            currentPrice = np;
          }
        }
      });

      // Якщо не знайшли в дочірніх — шукати в усьому тексті
      if (!currentPrice) {
        const gpText = gpClone.text().trim();
        if (gpText && /\d/.test(gpText)) {
          const np = extractNumericPrice(gpText);
          if (np && np !== extractedOld) {
            oldPrice = extractedOld;
            currentPrice = np;
          }
        }
      }
    }
  });

  if (oldPrice && currentPrice) return validatePricePair(oldPrice, currentPrice);

  // --- Стратегія 3: Спробувати відомі пари CSS класів ---
  const classPairs = [
    { old: '[class*="original-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="original-price"]', sale: '[class*="special-price"]' },
    { old: '[class*="original-price"]', sale: '[class*="discount-price"]' },
    { old: '[class*="regular-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="regular-price"]', sale: '[class*="special-price"]' },
    { old: '[class*="regular-price"]', sale: '[class*="final-price"]' },
    { old: '[class*="old-price"]', sale: '[class*="new-price"]' },
    { old: '[class*="old-price"]', sale: '[class*="current-price"]' },
    { old: '[class*="old-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="old-price"]', sale: '[class*="special-price"]' },
    { old: '[class*="was-price"]', sale: '[class*="now-price"]' },
    { old: '[class*="was-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="list-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="list-price"]', sale: '[class*="our-price"]' },
    { old: '[class*="price-was"]', sale: '[class*="price-now"]' },
    { old: '[class*="price-old"]', sale: '[class*="price-new"]' },
    { old: '[class*="price-old"]', sale: '[class*="price-current"]' },
    { old: '[class*="compare-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="price-before"]', sale: '[class*="price-after"]' },
    { old: '[class*="retail-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="full-price"]', sale: '[class*="sale-price"]' },
    { old: '[class*="price-strikethrough"]', sale: '[class*="price-current"]' },
  ];

  for (const pair of classPairs) {
    const oldEl = $(pair.old).first();
    const saleEl = $(pair.sale).first();
    if (oldEl.length && saleEl.length) {
      const op = extractNumericPrice(oldEl.text().trim());
      const np = extractNumericPrice(saleEl.text().trim());
      if (op && np && op !== np) {
        oldPrice = op;
        currentPrice = np;
        break;
      }
    }
  }

  return validatePricePair(oldPrice, currentPrice);
}

function extractPricesAdvanced(
  $: cheerio.CheerioAPI,
  html: string
): { currentPrice: string | null; oldPrice: string | null; discountEndDate: string | null } {
  let currentPrice: string | null = null;
  let oldPrice: string | null = null;
  let discountEndDate: string | null = null;

  // 1. Спробувати meta теги
  const metaSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]',
    'meta[property="product:price"]',
  ];

  for (const selector of metaSelectors) {
    const value = $(selector).attr("content");
    if (value) {
      const price = extractNumericPrice(value);
      if (price && !currentPrice) currentPrice = price;
    }
  }

  // Sale price from meta
  const saleMeta = $('meta[property="product:sale_price:amount"]').attr("content");
  if (saleMeta) {
    const salePrice = extractNumericPrice(saleMeta);
    if (salePrice && currentPrice && salePrice !== currentPrice) {
      oldPrice = currentPrice;
      currentPrice = salePrice;
    }
  }

  // Original price from meta
  if (!oldPrice) {
    const originalMetaVal = $('meta[property="product:original_price:amount"]').attr("content");
    if (originalMetaVal) {
      const origPrice = extractNumericPrice(originalMetaVal);
      if (origPrice && currentPrice && origPrice !== currentPrice) {
        oldPrice = origPrice;
      }
    }
  }

  // 2. Schema.org microdata
  const itemPropPrice = $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim();
  if (itemPropPrice && !currentPrice) {
    const price = extractNumericPrice(itemPropPrice);
    if (price) currentPrice = price;
  }

  // 3. Paired DOM extraction (del/s + sibling/parent for sale price)
  if (!oldPrice || !currentPrice) {
    const pairResult = extractPricePairFromDOM($);
    if (pairResult.oldPrice && pairResult.currentPrice) {
      if (!oldPrice) oldPrice = pairResult.oldPrice;
      if (!currentPrice || currentPrice === oldPrice) {
        currentPrice = pairResult.currentPrice;
      }
    }
  }

  // 4. Old/original price selectors
  const oldPriceSelectors = [
    '[class*="old-price"]', '[class*="oldprice"]', '[class*="oldPrice"]',
    '[class*="price-old"]', '[class*="priceOld"]',
    '[class*="price--old"]',
    '[class*="was-price"]', '[class*="wasPrice"]', '[class*="price-was"]', '[class*="priceWas"]',
    '[class*="original-price"]', '[class*="originalPrice"]', '[class*="originalprice"]',
    '[class*="list-price"]', '[class*="listPrice"]', '[class*="listprice"]',
    '[class*="price-compare"]', '[class*="comparePrice"]', '[class*="compare-price"]',
    '[class*="price-regular"]', '[class*="regular-price"]', '[class*="regularPrice"]',
    '[class*="retail-price"]', '[class*="retailPrice"]',
    '[class*="price-rrp"]', '[class*="rrp"]',
    '[class*="price-before"]', '[class*="before-price"]',
    '[class*="price-strikethrough"]', '[class*="strikethrough"]',
    '[class*="price-crossed"]', '[class*="crossed-price"]',
    '[class*="full-price"]', '[class*="fullPrice"]',
    '[class*="price-undiscounted"]',
    '[class*="price-base"]', '[class*="basePrice"]',
    '[class*="price-normal"]', '[class*="normalPrice"]',
    '[class*="price-previous"]', '[class*="previousPrice"]',
    '[data-price-type="oldPrice"]', '[data-price-type="regularPrice"]',
    '[class*="STRIKETHROUGH"]',
    "del",
    "s",
  ];

  if (!oldPrice) {
    for (const selector of oldPriceSelectors) {
      const elements = $(selector);
      elements.each((_, el) => {
        if (oldPrice) return;
        const text = $(el).text().trim();
        if (!text || !/\d/.test(text)) return;
        const price = extractNumericPrice(text);
        if (price && parseFloat(price.replace(/[^\d.]/g, "")) > 0) {
          oldPrice = price;
        }
      });
      if (oldPrice) break;
    }
  }

  // 5. Sale / current price with CSS selectors (з фільтрацією старих цін)
  if (!currentPrice) {
    const salePriceSelectors = [
      // Специфічні селектори ціни зі знижкою
      '[class*="sale-price"]', '[class*="salePrice"]', '[class*="price-sale"]',
      '[class*="special-price"]', '[class*="specialPrice"]', '[class*="price-special"]',
      '[class*="offer-price"]', '[class*="offerPrice"]',
      '[class*="deal-price"]', '[class*="dealPrice"]',
      '[class*="final-price"]', '[class*="finalPrice"]', '[class*="price-final"]',
      '[class*="discount-price"]', '[class*="discountPrice"]', '[class*="price-discount"]',
      '[class*="price-now"]', '[class*="now-price"]', '[class*="nowPrice"]',
      '[class*="price-current"]', '[class*="current-price"]', '[class*="currentPrice"]',
      '[class*="price__current"]',
      '[class*="price-new"]', '[class*="new-price"]', '[class*="newPrice"]',
      '[class*="price-actual"]', '[class*="actual-price"]',
      '[class*="price-reduced"]', '[class*="reduced-price"]',
      '[class*="our-price"]', '[class*="ourPrice"]',
      '[data-price-type="salePrice"]', '[data-price-type="finalPrice"]',
      // Загальні селектори
      '[data-testid*="price"]',
      '[data-price]',
      'ins [class*="amount"]', 'ins [class*="price"]',
      '[id*="price"]',
      '[class*="product-price"]', '[class*="productPrice"]',
      '.price',
      '[class*="cost"]',
      '[class*="amount"]',
    ];

    for (const selector of salePriceSelectors) {
      const elements = $(selector);
      let foundPrice: string | null = null;

      elements.each((_, el) => {
        if (foundPrice) return;
        // Пропустити якщо елемент всередині del/s або strikethrough (це стара ціна)
        if ($(el).closest('del, s, [style*="line-through"], [class*="STRIKETHROUGH"], [class*="strikethrough"]').length > 0) return;
        // Пропустити якщо має line-through інлайн стиль
        const style = $(el).attr('style') || '';
        if (style.includes('line-through')) return;
        // Пропустити savings/discount badges
        if (isDiscountBadge($, el)) return;
        // Пропустити елементи з класами старої ціни
        const className = $(el).attr('class') || '';
        if (
          /\b(old|was|original|compare|regular|retail|rrp|before|strikethrough|STRIKETHROUGH|crossed|full|undiscounted|previous|base|normal|list)[-_]?/i.test(className) &&
          !/\b(sale|special|offer|deal|final|discount|now|current|new|actual|reduced|our|primary)[-_]?/i.test(className)
        ) {
          return;
        }

        const text =
          $(el).attr("content") ||
          $(el).attr("data-price") ||
          $(el).text().trim();
        if (text) {
          const price = extractNumericPrice(text);
          if (price && parseFloat(price.replace(/[^\d.]/g, "")) > 0) {
            foundPrice = price;
          }
        }
      });

      if (foundPrice) {
        currentPrice = foundPrice;
        break;
      }
    }
  }

  // 6. JSON prices fallback
  if (!currentPrice) {
    const jsonPrice = extractPriceFromJSON(html);
    if (jsonPrice) currentPrice = jsonPrice;
  }

  // 7. Discount end date from common patterns
  const timerText = $(
    '[class*="countdown"], [class*="timer"], [class*="promo-end"], ' +
    '[class*="deal-end"], [class*="sale-end"], [class*="offer-end"]'
  ).text().trim();
  if (timerText) {
    discountEndDate = extractDateFromText(timerText);
  }

  // 8. Price validation (ensure oldPrice > currentPrice)
  if (oldPrice && currentPrice) {
    const oldNum = parseFloat(oldPrice.replace(/[^\d.]/g, ""));
    const curNum = parseFloat(currentPrice.replace(/[^\d.]/g, ""));
    if (!isNaN(oldNum) && !isNaN(curNum)) {
      if (oldNum < curNum) {
        [oldPrice, currentPrice] = [currentPrice, oldPrice];
      }
      if (oldNum === curNum) {
        oldPrice = null;
      }
    }
  }

  return { currentPrice, oldPrice, discountEndDate };
}

// Витягує дату з тексту (для закінчення акції)
function extractDateFromText(text: string): string | null {
  if (!text) return null;

  // ISO date: 2025-01-31 або 2025-01-31T23:59:59
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2}(?:T[\d:]+)?)/);
  if (isoMatch) return isoMatch[1];

  // DD.MM.YYYY або DD/MM/YYYY
  const euMatch = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (euMatch) return `${euMatch[3]}-${euMatch[2].padStart(2, "0")}-${euMatch[1].padStart(2, "0")}`;

  // MM/DD/YYYY
  const usMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const month = parseInt(usMatch[1]);
    if (month <= 12) return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
  }

  // "Jan 31, 2025" or "January 31 2025"
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const namedMonth = text.match(/(\w{3,})\s+(\d{1,2}),?\s*(\d{4})/i);
  if (namedMonth) {
    const m = months[namedMonth[1].toLowerCase().slice(0, 3)];
    if (m) return `${namedMonth[3]}-${m}-${namedMonth[2].padStart(2, "0")}`;
  }

  // "31 Jan 2025"
  const namedMonth2 = text.match(/(\d{1,2})\s+(\w{3,}),?\s*(\d{4})/i);
  if (namedMonth2) {
    const m = months[namedMonth2[2].toLowerCase().slice(0, 3)];
    if (m) return `${namedMonth2[3]}-${m}-${namedMonth2[1].padStart(2, "0")}`;
  }

  return null;
}

// Витягує числову ціну з тексту (підтримка US, European, та пробільних форматів)
function extractNumericPrice(text: string): string | null {
  if (!text) return null;

  // Видаляємо символи валют та інші нечислові (зберігаємо цифри, крапки, коми, пробіли)
  let cleaned = text.replace(/[^\d\s,.\-]/g, "").trim();
  if (!cleaned || !/\d/.test(cleaned)) return null;

  // Видаляємо початкові/кінцеві роздільники
  cleaned = cleaned.replace(/^[\s,.\-]+|[\s,.\-]+$/g, "");
  if (!cleaned) return null;

  // Визначаємо формат числа та нормалізуємо
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      // Європейський: 1.234,56
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // US/UK: 1,234.56
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length === 3) {
      // Роздільник тисяч: 1,234
      cleaned = cleaned.replace(",", "");
    } else if (parts.length > 2) {
      // Декілька ком — роздільники тисяч: 1,234,567
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // Десятковий роздільник: 12,50 або 12,5
      cleaned = cleaned.replace(",", ".");
    }
  } else if (hasDot) {
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      // Декілька крапок — роздільники тисяч: 1.234.567
      cleaned = cleaned.replace(/\./g, "");
    }
    // Одна крапка — десятковий роздільник, залишаємо
  }

  // Видаляємо пробіли (роздільники тисяч: 1 234 → 1234)
  cleaned = cleaned.replace(/\s/g, "");

  const numPrice = parseFloat(cleaned);
  // Перевірка: реальна ціна (не рік, не ID тощо)
  if (isNaN(numPrice) || numPrice <= 0 || numPrice >= 10000000) return null;

  return cleaned;
}

// Витягує ціну з JSON структур в HTML
function extractPriceFromJSON(html: string): string | null {
  // Шукаємо різні JSON структури
  const jsonPatterns = [
    /"price[":]*\s*(\d+\.?\d*)/i,
    /"amount[":]*\s*(\d+\.?\d*)/i,
    /"current[^"]*price[":]*\s*(\d+\.?\d*)/i,
    /price['":\s]*(\d+\.?\d*)/i,
  ];

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = extractNumericPrice(match[1]);
      if (price) return price;
    }
  }

  return null;
}

function extractPriceRegex(html: string): string | null {
  const patterns = [
    // Meta теги
    /content=["'](\d+\.?\d*)\s*UAH["']/i,
    /content=["'](\d+\.?\d*)\s*USD["']/i,
    /content=["'](\d+\.?\d*)\s*EUR["']/i,
    /content=["'](\d+[,.\s]*\d*)["']/i,
    
    // Символи валют
    /₴\s*([\d\s,.]+)/,
    /\$\s*([\d\s,.]+)/,
    /€\s*([\d\s,.]+)/,
    /£\s*([\d\s,.]+)/,
    
    // JSON паттерни
    /"price[":]*\s*(\d+\.?\d*)/i,
    /"amount[":]*\s*(\d+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = extractNumericPrice(match[1]);
      if (price) return price;
    }
  }

  return null;
}

// === OTHER EXTRACTORS ===

function extractTitle($: cheerio.CheerioAPI): string | null {
  const selectors = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'h1[itemprop="name"]',
    'h1[class*="title"]',
    'h1[class*="product"]',
    "h1",
    "title",
  ];

  for (const selector of selectors) {
    const value = $(selector).attr("content") || $(selector).text().trim();
    if (value && value.length > 0) return value;
  }

  return null;
}

function extractDescription($: cheerio.CheerioAPI): string | null {
  const selectors = [
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
    'div[itemprop="description"]',
    '[class*="description"]',
  ];

  for (const selector of selectors) {
    const value = $(selector).attr("content") || $(selector).text().trim();
    if (value && value.length > 0) return value;
  }

  return null;
}

function extractImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'img[itemprop="image"]',
    '[class*="product"] img',
    '[class*="gallery"] img',
    "img[data-main]",
  ];

  for (const selector of selectors) {
    let value = $(selector).attr("content") || $(selector).attr("src");
    if (value) {
      if (value.startsWith("//")) {
        value = "https:" + value;
      } else if (value.startsWith("/")) {
        const urlObj = new URL(baseUrl);
        value = urlObj.origin + value;
      }
      return value;
    }
  }

  return null;
}

function extractMetaTagRegex(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

function extractTagRegex(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}