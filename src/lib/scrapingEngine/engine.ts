import type { StoredSchema, MatchStrategy } from "../types";
import { findMatches, findChildMatches } from "../match";

export class ScrapingEngine {
  private schema: StoredSchema;
  private document: Document;

  constructor(schema: StoredSchema, document: Document) {
    this.schema = schema;
    this.document = document;
  }

  private createElementFromHTML(htmlString: string | null): HTMLElement | null {
    if (!htmlString) return null;
    const div = this.document.createElement("div");
    div.innerHTML = htmlString.trim();
    return div.firstElementChild as HTMLElement;
  }

  async scrape() {
    const parentElement = this.createElementFromHTML(this.schema.Parent);
    if (!parentElement || !this.schema.ParentMatch?.strategy) {
      return [];
    }

    const parentMatches = findMatches(
      parentElement,
      this.schema.ParentMatch.strategy,
      3,
      this.document
    );

    const results = await Promise.all(
      parentMatches.map(async (parent) => {
        const result: Record<string, string | string[]> = {};

        for (const field of this.schema.Fields) {
          const fieldElement = this.createElementFromHTML(field.Element);
          if (!fieldElement || !field.strategy) continue;

          const matchResult = await findChildMatches(
            [parent],
            fieldElement,
            this.document,
            field.strategy,
            field.MaxMatches
          );

          if (field.Type === "text") {
            result[field.Name] = matchResult.matches.map(
              (el: HTMLElement) => el.textContent?.trim() || ""
            );
          } else if (field.Type === "link") {
            result[field.Name] = matchResult.matches.map((el: HTMLElement) => {
              const anchor = el.closest("a");
              return anchor?.href || "";
            });
          }
        }

        return result;
      })
    );

    return results;
  }
}
