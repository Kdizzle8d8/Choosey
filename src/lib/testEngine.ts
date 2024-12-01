import { ScrapingEngine } from "@/lib/scrapingEngine/engine";
import type { StoredSchema } from "./types";
import puppeteer from "puppeteer";
import { JSDOM } from "jsdom";

const getDocumentFromUrl = async (url: string): Promise<Document> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return new JSDOM(html).window.document;
};

const document = await getDocumentFromUrl("https://www.ebay.com/");

if (!document) {
  throw new Error("Document not found");
} else {
  console.log("Document found");
  console.log("Testing document");
  const res = document.querySelectorAll("h3");
  if (res.length > 5) {
    console.log("Found more than 5 h3 elements");
  }
}

const schema: StoredSchema = {
  Name: "Item Listing",
  Parent: `<div class="vlp-merch-item-info">
    <h3 class="vlp-merch-item-title vlp-merch-item-title-dweb vlp-merch-item-title-margin">
      Nike Zoom Field Jaxx Travis Scott Light Chocolate Size 8.5
    </h3>
    <div class="vlp-merch-sub-group">
      <div class="vlp-merch-price">
        <span role="text">$220.50</span>
      </div>
    </div>
  </div>`,
  urls: ["https://www.ebay.com/"],
  ParentMatch: {
    strategy: "exact",
  },
  Fields: [
    {
      Name: "Title",
      Type: "text",
      Element: `<h3 class="vlp-merch-item-title vlp-merch-item-title-dweb vlp-merch-item-title-margin">
        Nike Zoom Field Jaxx Travis Scott Light Chocolate Size 8.5
      </h3>`,
      strategy: "exact",
      MaxMatches: 1,
    },
    {
      Name: "Price",
      Type: "text",
      Element: `<span role="text">$220.50</span>`,
      strategy: "exact",
      MaxMatches: 1,
    },
  ],
};

console.log("Initializing engine");
const engine = new ScrapingEngine(schema, document);
console.log("Engine initialized");

// Update to handle async scrape
const main = async () => {
  const results = await engine.scrape();
  console.log(
    `Found ${results.length} parent matches and ${
      results.flatMap((r) => Object.values(r).flat()).length
    } child matches`
  );
  console.log("Scraping results:", JSON.stringify(results, null, 2));
};

main().catch(console.error);
