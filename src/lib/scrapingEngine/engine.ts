import puppeteer from "puppeteer";
import { findMatches, findChildMatches } from "../match";
import type { Schema } from "../types";

export class ScrapingEngine {
  schema: Schema;
  document: Document;

  constructor(schema: Schema, document: Document) {
    this.schema = schema;
    this.document = document;
    console.log(this.schema.Parent.outerHTML);
    const parentMatches = findMatches(
      schema.ParentMatch.matches[0],
      schema.ParentMatch.strategy ?? "exact",
      2,
      document
    );
    if (parentMatches.length === 0) {
      throw new Error("Parent element not found");
    }
    this.schema.Parent = parentMatches[0];

    for (const field of schema.Fields) {
      const fieldMatches = findMatches(
        field.Element,
        field.strategy ?? "exact",
        2,
        document
      );
      field.Matches = fieldMatches;
    }
    console.log("Schema Initialized", this.schema);
    console.log(
      `Found ${this.schema.Fields.flatMap((f) => f.Matches).length} matches`
    );
  }

  private createElementFromHTML(htmlString: string): HTMLElement {
    const div = this.document.createElement("div");
    div.innerHTML = htmlString.trim();
    return (div.firstElementChild as HTMLElement) || div;
  }

  scrape(): ScrapeResult[] {
    console.log("Scraping", this.schema);
    let results: ScrapeResult[] = [];
    this.schema.ParentMatch.matches.forEach((parentMatch) => {
      const fields: ScrapeResult["fields"] = {};

      this.schema.Fields.forEach((field) => {
        const fieldMatch = field.Matches.find((match) =>
          parentMatch.contains(match)
        );
        if (fieldMatch) {
          fields[field.Name] = {
            text: fieldMatch.textContent?.trim() || "",
            href:
              field.Type === "link"
                ? (fieldMatch as HTMLAnchorElement).href
                : undefined,
          };
        }
      });

      if (Object.keys(fields).length > 0) {
        results.push({
          SchemaName: this.schema.Name,
          fields,
        });
      }
    });
    return results;
  }
}

type ScrapeResult = {
  SchemaName: string;
  fields: {
    [key: string]: {
      text: string;
      href?: string;
    };
  };
};
