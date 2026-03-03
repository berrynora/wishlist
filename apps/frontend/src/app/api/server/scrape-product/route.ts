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

  // Epicentr uses <data> elements for prices.
  // Old price: <data> with strikethrough styling (small font, #333333)
  // Current price: <data> with large red font (#D21E1E)
  // Also look for common epicentr selectors
  let oldPrice: string | null = null;
  let currentPrice: string | null = null;

  // 1. Try JSON-LD for structured pricing
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item["@type"] === "Product" && item.offers) {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offer.price) {
            currentPrice = currentPrice || extractNumericPrice(String(offer.price));
          }
          if (offer.highPrice) {
            oldPrice = oldPrice || extractNumericPrice(String(offer.highPrice));
          }
        }
      }
    } catch { /* ignore */ }
  });

  // 2. Meta tag prices (often the original/list price)
  const metaPrice =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content");
  if (metaPrice) {
    const mp = extractNumericPrice(metaPrice);
    if (mp && !oldPrice) oldPrice = mp;
  }

  // 3. Epicentr-specific: <data> elements
  //    The strikethrough old price usually has text-decoration: line-through
  //    or is inside a <del>/<s> tag, or has a specific class
  $('del, s, [style*="line-through"]').each((_, el) => {
    if (oldPrice) return;
    const text = $(el).text().trim();
    const price = extractNumericPrice(text);
    if (price && parseFloat(price.replace(/[^\d.]/g, "")) > 0) {
      oldPrice = price;
    }
  });

  // 4. Look for data elements — pick the largest price as old, smallest as current
  const dataPrices: number[] = [];
  $("data").each((_, el) => {
    const val = $(el).attr("value");
    const text = $(el).text().trim();
    const priceStr = extractNumericPrice(val || "") || extractNumericPrice(text);
    if (priceStr) {
      const num = parseFloat(priceStr.replace(/[^\d.]/g, ""));
      if (num > 0 && num < 10000000) dataPrices.push(num);
    }
  });

  if (dataPrices.length >= 2) {
    const sorted = [...new Set(dataPrices)].sort((a, b) => b - a);
    if (sorted.length >= 2) {
      oldPrice = oldPrice || String(sorted[0]);
      currentPrice = String(sorted[sorted.length > 2 ? sorted.length - 1 : 1]);
    }
  } else if (dataPrices.length === 1 && !currentPrice) {
    currentPrice = String(dataPrices[0]);
  }

  // 5. Regex fallback for "8 580 ₴" pattern
  if (!currentPrice) {
    const priceMatch = html.match(/(\d[\d\s]*\d)\s*₴\/шт/i);
    if (priceMatch) {
      currentPrice = extractNumericPrice(priceMatch[1]);
    }
  }

  // 6. Ensure oldPrice > currentPrice (swap if meta gave us the wrong one)
  if (oldPrice && currentPrice) {
    const oldNum = parseFloat(oldPrice.replace(/[^\d.]/g, ""));
    const curNum = parseFloat(currentPrice.replace(/[^\d.]/g, ""));
    if (oldNum < curNum) {
      [oldPrice, currentPrice] = [currentPrice, oldPrice];
    }
    if (oldNum === curNum) {
      oldPrice = null; // same price = no discount
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

function scrapeProm(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const oldPriceText = $('[data-qaid="product_old_price"], [class*="old-price"]').text().trim();
  const currentPriceText =
    $('[data-qaid="product_price"]').text().trim() ||
    $(".product-price").text().trim() ||
    $('[class*="price"]').first().text().trim();

  const currentPrice = extractNumericPrice(currentPriceText) || extractPriceFromJSON(html);
  const oldPrice = extractNumericPrice(oldPriceText);
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

  const currentPriceText =
    $(".x-price-primary").text().trim() ||
    $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim();
  const oldPriceText = $(".x-price-was").text().trim();

  const currentPrice = extractNumericPrice(currentPriceText) || extractPriceFromJSON(html);
  const oldPrice = extractNumericPrice(oldPriceText);
  const hasDiscount = Boolean(oldPrice && currentPrice && oldPrice !== currentPrice);

  return {
    title: $("h1.x-item-title__mainTitle").text().trim() || extractTitle($),
    description: extractDescription($),
    image: extractImage($, url),
    price: hasDiscount ? oldPrice : currentPrice,
    discount_price: hasDiscount ? currentPrice : null,
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

        // Обробка масиву JSON-LD
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (
            item["@type"] === "Product" ||
            item["@type"] === "http://schema.org/Product"
          ) {
            const offers = item.offers;
            let price: string | null = null;
            let discountPrice: string | null = null;
            let hasDiscount = false;
            let discountEndDate: string | null = null;

            if (offers) {
              const offer = Array.isArray(offers) ? offers[0] : offers;
              price = offer?.price || offer?.lowPrice;

              // Check for sale/discount price patterns
              if (offer?.price && offer?.highPrice && offer.price !== offer.highPrice) {
                // highPrice = original, price = sale
                price = String(offer.highPrice);
                discountPrice = String(offer.price);
                hasDiscount = true;
              }

              // Schema.org priceValidUntil
              if (offer?.priceValidUntil) {
                discountEndDate = offer.priceValidUntil;
              }
            }

            return {
              title: item.name || null,
              description: item.description || null,
              image:
                (Array.isArray(item.image) ? item.image[0] : item.image) ||
                null,
              price: price ? String(price) : null,
              discount_price: discountPrice ? String(discountPrice) : null,
              has_discount: hasDiscount,
              discount_end_date: discountEndDate,
            };
          }
        }
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

  // 2. Schema.org microdata
  const itemPropPrice = $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim();
  if (itemPropPrice && !currentPrice) {
    const price = extractNumericPrice(itemPropPrice);
    if (price) currentPrice = price;
  }

  // 3. Old/original price selectors
  const oldPriceSelectors = [
    '[class*="old-price"]',
    '[class*="price-old"]',
    '[class*="price--old"]',
    '[class*="was-price"]',
    '[class*="price-was"]',
    '[class*="original-price"]',
    '[class*="list-price"]',
    '[class*="price-compare"]',
    '[class*="comparePrice"]',
    "del",
    "s",
  ];

  if (!oldPrice) {
    for (const selector of oldPriceSelectors) {
      const elements = $(selector);
      elements.each((_, el) => {
        if (oldPrice) return;
        const text = $(el).text().trim();
        if (text) {
          const price = extractNumericPrice(text);
          if (price && parseFloat(price.replace(/[^\d.]/g, "")) > 0) {
            oldPrice = price;
          }
        }
      });
      if (oldPrice) break;
    }
  }

  // 4. Current price with CSS selectors (if not yet found)
  if (!currentPrice) {
    const cssSelectors = [
      '[data-testid*="price"]',
      '[data-price]',
      '[class*="price-current"]',
      '[class*="price__current"]',
      '[class*="current-price"]',
      '[class*="sale-price"]',
      '[id*="price"]',
      '[class*="product-price"]',
      '[class*="productPrice"]',
      '.price',
      '[class*="cost"]',
      '[class*="amount"]',
    ];

    for (const selector of cssSelectors) {
      const elements = $(selector);
      let foundPrice: string | null = null;

      elements.each((_, el) => {
        if (foundPrice) return;
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

  // 5. JSON prices fallback
  if (!currentPrice) {
    const jsonPrice = extractPriceFromJSON(html);
    if (jsonPrice) currentPrice = jsonPrice;
  }

  // 6. Discount end date from common patterns
  const timerText = $('[class*="countdown"], [class*="timer"], [class*="promo-end"], [class*="deal-end"], [class*="sale-end"]').text().trim();
  if (timerText) {
    discountEndDate = extractDateFromText(timerText);
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

// Витягує числову ціну з тексту
function extractNumericPrice(text: string): string | null {
  if (!text) return null;

  // Видаляємо всі символи крім цифр, крапок, ком та пробілів
  const cleaned = text.replace(/[^\d\s,.\₴$€£¥]/g, "");

  // Шукаємо паттерни цін
  const patterns = [
    /(\d+[\s,]*\d*\.?\d*)/,  // 1000.50 або 1 000,50
    /(\d+[.,]\d+)/,          // 1000.50 або 1000,50
    /(\d+)/,                 // просто числа
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const price = match[1].replace(/\s/g, "").replace(",", ".");
      const numPrice = parseFloat(price);
      
      // Перевірка що це реальна ціна (не рік, не ID тощо)
      if (numPrice > 0 && numPrice < 10000000) {
        return price;
      }
    }
  }

  return null;
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