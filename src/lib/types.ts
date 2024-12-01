export type FieldType = "text" | "link";
export type MatchStrategy = "exact";

// For schemas that are being edited/displayed in the UI
export type RuntimeSchema = {
  Name: string;
  Parent: HTMLElement | null;
  urls: string[];
  ParentMatch: {
    strategy: MatchStrategy;
    matches: HTMLElement[];
  } | null;
  Fields: {
    Name: string;
    Type: FieldType;
    Element: HTMLElement | null;
    Matches: HTMLElement[];
    MaxMatches: number;
    strategy?: MatchStrategy;
  }[];
};

// For storing schemas and using in the scraping engine
export type StoredSchema = {
  Name: string;
  Parent: string | null; // HTML string
  urls: string[];
  ParentMatch: {
    strategy: MatchStrategy;
  } | null;
  Fields: {
    Name: string;
    Type: FieldType;
    Element: string | null; // HTML string
    MaxMatches: number;
    strategy?: MatchStrategy;
  }[];
};
