import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

interface ProductData {
  title: string | null;
  description: string | null;
  image: string | null;
  price: string | null;
}

type ScraperMethod = (html: string, url: string) => ProductData;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Fetch HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Спочатку перевіряємо специфічні парсери для відомих сайтів
    const siteSpecificResult = tryDomainSpecificScraper(html, url);
    if (siteSpecificResult.price) {
      return NextResponse.json(siteSpecificResult);
    }

    // Ланцюжок методів парсингу (від найспецифічнішого до найзагальнішого)
    const scrapers: ScraperMethod[] = [
      scrapeWithJSONLD,
      scrapeWithCheerio,
      scrapeWithRegex,
    ];

    // Пробуємо кожен метод і збираємо результати
    let product: ProductData = {
      title: null,
      description: null,
      image: null,
      price: null,
    };

    for (const scraper of scrapers) {
      const result = scraper(html, url);

      // Заповнюємо тільки ті поля, які ще не знайдені
      if (!product.title && result.title) product.title = result.title;
      if (!product.description && result.description)
        product.description = result.description;
      if (!product.image && result.image) product.image = result.image;
      if (!product.price && result.price) product.price = result.price;

      // Якщо всі поля знайдені - виходимо
      if (
        product.title &&
        product.description &&
        product.image &&
        product.price
      ) {
        break;
      }
    }

    // Якщо нічого не знайдено - повертаємо помилку
    if (
      !product.title &&
      !product.description &&
      !product.image &&
      !product.price
    ) {
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
  } else if (domain.includes("prom.ua")) {
    return scrapeProm(html, url);
  } else if (domain.includes("amazon.")) {
    return scrapeAmazon(html, url);
  } else if (domain.includes("ebay.")) {
    return scrapeEbay(html, url);
  } else if (domain.includes("olx.ua")) {
    return scrapeOLX(html, url);
  }

  return { title: null, description: null, image: null, price: null };
}

function scrapeRozetka(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  // Rozetka зберігає ціну в data-атрибутах
  const priceText =
    $('[data-testid="price"]').text().trim() ||
    $(".product-price__big").text().trim() ||
    $('[class*="price"]').first().text().trim();

  const price = extractNumericPrice(priceText) || extractPriceFromJSON(html);

  return {
    title: $("h1.product__title").text().trim() || extractTitle($),
    description: extractDescription($),
    image:
      $('meta[property="og:image"]').attr("content") || extractImage($, url),
    price: price,
  };
}

function scrapeProm(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const priceText =
    $('[data-qaid="product_price"]').text().trim() ||
    $(".product-price").text().trim() ||
    $('[class*="price"]').first().text().trim();

  const price = extractNumericPrice(priceText) || extractPriceFromJSON(html);

  return {
    title: $("h1").first().text().trim() || extractTitle($),
    description: extractDescription($),
    image: extractImage($, url),
    price: price,
  };
}

function scrapeAmazon(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const priceText =
    $(".a-price .a-offscreen").first().text().trim() ||
    $("#priceblock_ourprice").text().trim() ||
    $("#priceblock_dealprice").text().trim() ||
    $(".a-price-whole").first().text().trim();

  const price = extractNumericPrice(priceText) || extractPriceFromJSON(html);

  return {
    title: $("#productTitle").text().trim() || extractTitle($),
    description: extractDescription($),
    image: $("#landingImage").attr("src") || extractImage($, url),
    price: price,
  };
}

function scrapeEbay(html: string, url: string): ProductData {
  const $ = cheerio.load(html);

  const priceText =
    $(".x-price-primary").text().trim() ||
    $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim();

  const price = extractNumericPrice(priceText) || extractPriceFromJSON(html);

  return {
    title: $("h1.x-item-title__mainTitle").text().trim() || extractTitle($),
    description: extractDescription($),
    image: extractImage($, url),
    price: price,
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
  };
}

// === GENERIC SCRAPERS ===

// Метод 1: JSON-LD (найнадійніший для ціни)
function scrapeWithJSONLD(html: string, url: string): ProductData {
  try {
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (!jsonLdMatch) {
      return { title: null, description: null, image: null, price: null };
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

            if (offers) {
              // Обробка різних форматів offers
              if (Array.isArray(offers)) {
                price = offers[0]?.price || offers[0]?.lowPrice;
              } else {
                price = offers.price || offers.lowPrice;
              }
            }

            return {
              title: item.name || null,
              description: item.description || null,
              image:
                (Array.isArray(item.image) ? item.image[0] : item.image) ||
                null,
              price: price ? String(price) : null,
            };
          }
        }
      } catch (e) {
        continue;
      }
    }

    return { title: null, description: null, image: null, price: null };
  } catch (error) {
    console.error("JSON-LD scraping failed:", error);
    return { title: null, description: null, image: null, price: null };
  }
}

// Метод 2: Cheerio з покращеним парсингом ціни
function scrapeWithCheerio(html: string, url: string): ProductData {
  try {
    const $ = cheerio.load(html);

    return {
      title: extractTitle($),
      description: extractDescription($),
      image: extractImage($, url),
      price: extractPriceAdvanced($, html),
    };
  } catch (error) {
    console.error("Cheerio scraping failed:", error);
    return { title: null, description: null, image: null, price: null };
  }
}

// Метод 3: Regex (запасний варіант)
function scrapeWithRegex(html: string, url: string): ProductData {
  try {
    return {
      title:
        extractMetaTagRegex(html, "og:title") || extractTagRegex(html, "h1"),
      description:
        extractMetaTagRegex(html, "og:description") ||
        extractMetaTagRegex(html, "description"),
      image: extractMetaTagRegex(html, "og:image"),
      price: extractPriceRegex(html),
    };
  } catch (error) {
    console.error("Regex scraping failed:", error);
    return { title: null, description: null, image: null, price: null };
  }
}

// === PRICE EXTRACTION HELPERS ===

function extractPriceAdvanced(
  $: cheerio.CheerioAPI,
  html: string
): string | null {
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
      if (price) return price;
    }
  }

  // 2. Schema.org microdata
  const itemPropPrice = $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim();
  if (itemPropPrice) {
    const price = extractNumericPrice(itemPropPrice);
    if (price) return price;
  }

  // 3. Множинні CSS селектори з пріоритетом
  const cssSelectors = [
    '[data-testid*="price"]',
    '[data-price]',
    '[class*="price-current"]',
    '[class*="price__current"]',
    '[class*="current-price"]',
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
      if (foundPrice) return; // Вже знайшли, виходимо
      
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
    
    if (foundPrice) return foundPrice;
  }

  // 4. Витягнути з JSON в HTML (window.__INITIAL_STATE__ тощо)
  const jsonPrice = extractPriceFromJSON(html);
  if (jsonPrice) return jsonPrice;

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