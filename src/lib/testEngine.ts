import { ScrapingEngine } from "@/lib/scrapingEngine/engine";
import { Schema } from "./types";
import puppeteer from "puppeteer";
import { JSDOM } from "jsdom";

const getDocumentFromUrl = async (url: string): Promise<Document> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content();
  return new JSDOM(html).window.document;
};
const document = await getDocumentFromUrl("https://www.ebay.com/");
const createElementFromHTML = (htmlString: string): HTMLElement => {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return (div.firstElementChild as HTMLElement) || div;
};
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

const schema: Schema = {
  Name: "Item Listing",
  Parent: createElementFromHTML(
    `<div class="vlp-merch-item-info" style="outline: rgb(255, 215, 0) solid 2px; outline-offset: 1px; background-color: rgba(255, 215, 0, 0.125); transition: background-color 0.1s ease-in-out;"><h3 class="vlp-merch-item-title vlp-merch-item-title-dweb vlp-merch-item-title-margin" style="outline: rgb(255, 215, 0) solid 2px; outline-offset: 1px; background-color: rgba(255, 215, 0, 0.125); transition: background-color 0.1s ease-in-out;">Nike Zoom Field Jaxx Travis Scott Light Chocolate Size 8.5</h3><div class="vlp-merch-sub-group"><div class="vlp-merch-price"><span role="text" style="outline: rgb(255, 215, 0) solid 2px; outline-offset: 1px; background-color: rgba(255, 215, 0, 0.125); transition: background-color 0.1s ease-in-out;">$220.50</span></div></div></div>`
  ),
  urls: ["https://www.ebay.com/"],
  ParentMatch: {
    strategy: "exact",
    matches: [],
  },
  Fields: [
    {
      Name: "Title",
      Type: "text",
      Element: createElementFromHTML(
        `<h3 class="vlp-merch-item-title vlp-merch-item-title-dweb vlp-merch-item-title-margin" style="outline: rgb(255, 215, 0) solid 2px; outline-offset: 1px; background-color: rgba(255, 215, 0, 0.125); transition: background-color 0.1s ease-in-out;">Nike Zoom Field Jaxx Travis Scott Light Chocolate Size 8.5</h3>`
      ),
      strategy: "exact",
      Matches: [],
    },
    {
      Name: "Price",
      Type: "text",
      Element: createElementFromHTML(
        `<span role="text" style="outline: rgb(255, 215, 0) solid 2px; outline-offset: 1px; background-color: rgba(255, 215, 0, 0.125); transition: background-color 0.1s ease-in-out;">$220.50</span>`
      ),
      strategy: "exact",
      Matches: [],
    },
  ],
};
console.log("Initializing engine");
const engine = new ScrapingEngine(schema, document);

console.log(
  `Found ${engine.schema.ParentMatch.matches.length} parent matches and ${
    engine.schema.Fields.flatMap((f) => f.Matches).length
  } child matches`
);
console.log("Engine initialized");
const results = engine.scrape();
console.log(results);
