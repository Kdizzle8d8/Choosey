export type FieldType = "text" | "number" | "date";

export type StoredSchema = {
  Name: string;
  Parent: string | null;
  urls: {
    url: string;
    active: boolean;
  }[];
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
  urls: {
    url: string;
    active: boolean;
  }[];
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
