export type FieldType = "text" | "link";

export type StoredSchema = {
  Name: string;
  Parent: string | null;
  urls: string[];
  ParentMatch: {
    strategy: MatchStrategy;
  } | null;
  Fields: {
    Name: string;
    Type: FieldType;
    Element: string | null;
    MaxMatches?: number;
    strategy?: MatchStrategy;
  }[];
};

export type Schema = {
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
    MaxMatches?: number;
    strategy?: MatchStrategy;
  }[];
};

export type MatchStrategy = "exact" | "similar" | "xpath" | "selector";
