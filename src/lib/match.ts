export type MatchStrategy = "exact";

export type MatchResult = {
  strategy: MatchStrategy;
  matches: HTMLElement[];
};

export const findMatches = (
  element: HTMLElement,
  strategy: MatchStrategy,
  retryCount: number = 3,
  document: Document
): HTMLElement[] => {
  if (!element) return [];

  const tryFind = () => findExactMatches(element, document);

  // First attempt
  let matches = tryFind();

  // If no matches found, retry immediately up to retryCount times
  let attempts = 0;
  while (matches.length === 0 && attempts < retryCount) {
    setTimeout(() => {
      matches = tryFind();
      attempts++;
    }, 500);
  }

  return matches;
};

const findExactMatches = (
  element: HTMLElement,
  document: Document
): HTMLElement[] => {
  const selector = element.tagName.toLowerCase();
  const classes = Array.from(element.classList).join(".");
  return Array.from(
    document.querySelectorAll(`${selector}${classes ? "." + classes : ""}`)
  ) as HTMLElement[];
};

export const findChildMatches = async (
  parentMatches: HTMLElement[],
  childElement: HTMLElement,
  document: Document,
  strategy: MatchStrategy = "exact",
  maxMatches?: number
): Promise<MatchResult> => {
  if (!childElement || parentMatches.length === 0) {
    return {
      strategy: "exact",
      matches: [],
    };
  }

  const findMatchesInParent = (parent: HTMLElement): HTMLElement[] => {
    const potentialMatches = findMatches(childElement, "exact", 3, document);
    return potentialMatches.filter((match) => parent.contains(match));
  };

  const allMatches: HTMLElement[] = [];
  for (const parent of parentMatches) {
    const matches = findMatchesInParent(parent);
    if (maxMatches) {
      allMatches.push(...matches.slice(0, maxMatches));
    } else {
      allMatches.push(...matches);
    }
  }

  return {
    strategy: "exact",
    matches: allMatches,
  };
};

export const findRelativeElement = (
  element: HTMLElement,
  direction: "parent" | "child"
): HTMLElement | null => {
  if (!element) return null;

  if (direction === "parent") {
    const parent = element.parentElement;
    if (parent && parent !== document.body) {
      return parent;
    }
  } else if (direction === "child") {
    const child = element.firstElementChild;
    if (child) {
      return child as HTMLElement;
    }
  }

  return null;
};
