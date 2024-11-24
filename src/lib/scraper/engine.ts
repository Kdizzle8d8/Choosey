import { findMatches, findChildMatches } from "../match";
import type { Schema } from "./schema";
import type { ScrapedData, ScrapedField } from "./types";

export class ScraperEngine {
  private document: Document;

  constructor(document?: Document) {
    this.document = document || window.document;
  }

  private createElementFromHTML(html: string): HTMLElement {
    const div = this.document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstElementChild as HTMLElement;
  }

  async scrape(schema: Schema): Promise<ScrapedData[]> {
    const results: ScrapedData[] = [];

    if (!schema.parent.element) {
      console.warn("No parent element defined in schema");
      return results;
    }

    // Find parent elements
    const parentElement = this.createElementFromHTML(schema.parent.element);
    const parentMatches = await findMatches(
      parentElement,
      schema.parent.strategy
    );

    console.log(`Found ${parentMatches.length} parent matches`);

    // Process each parent match
    for (const parent of parentMatches) {
      const data: ScrapedData = {
        schemaName: schema.name,
        parentElement: parent.outerHTML,
        fields: {},
        url: this.document.location?.href,
      };

      // Process each field within this parent
      for (const field of schema.fields) {
        if (!field.element) {
          console.warn(`Field ${field.name} has no element defined`);
          continue;
        }

        const fieldData = await this.scrapeField(parent, field);
        console.log(`Field ${field.name} data:`, fieldData);

        if (fieldData) {
          data.fields[field.name] = fieldData;
        }
      }

      results.push(data);
    }

    return results;
  }

  private async scrapeField(
    parent: HTMLElement,
    field: Schema["fields"][number]
  ): Promise<ScrapedField | null> {
    try {
      const fieldElement = this.createElementFromHTML(field.element);
      const { matches } = await findChildMatches(
        [parent],
        fieldElement,
        field.strategy || "exact",
        field.maxMatches
      );

      // Find all matches that are descendants of the parent
      const validMatches = matches.filter((el) => parent.contains(el));

      if (validMatches.length === 0) {
        console.warn(`No matches found for field ${field.name} in parent`);
        return null;
      }

      // Use the first valid match
      const match = validMatches[0];

      switch (field.type) {
        case "link":
          const href =
            match instanceof HTMLAnchorElement
              ? match.href
              : match.querySelector("a")?.href;

          return {
            text: match.textContent?.trim() || "",
            href,
          };
        case "text":
        default:
          return {
            text: match.textContent?.trim() || "",
          };
      }
    } catch (error) {
      console.error(`Error scraping field ${field.name}:`, error);
      return null;
    }
  }
}

export default ScraperEngine;
