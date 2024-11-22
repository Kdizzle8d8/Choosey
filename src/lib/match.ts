export type MatchStrategy = "exact" | "similar" | "xpath" | "selector";

export type MatchResult = {
  strategy: MatchStrategy;
  matches: HTMLElement[];
};

export const findMatches = async (
  element: HTMLElement,
  strategy: MatchStrategy,
  retryCount: number = 3
): Promise<HTMLElement[]> => {
  if (!element) return [];

  const tryFind = () => {
    switch (strategy) {
      case "exact":
        return findExactMatches(element);
      case "similar":
        return findSimilarMatches(element);
      case "xpath":
        return findXPathMatches(element);
      case "selector":
        return findSelectorMatches(element);
      default:
        return [];
    }
  };

  // First attempt
  let matches = tryFind();

  // If no matches found, retry with delay
  let attempts = 0;
  while (matches.length === 0 && attempts < retryCount) {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
    matches = tryFind();
    attempts++;
  }

  return matches;
};

const findExactMatches = (element: HTMLElement): HTMLElement[] => {
  const selector = element.tagName.toLowerCase();
  const classes = Array.from(element.classList).join(".");
  return Array.from(
    document.querySelectorAll(`${selector}${classes ? "." + classes : ""}`)
  ) as HTMLElement[];
};

const findSimilarMatches = (element: HTMLElement): HTMLElement[] => {
  const selector = element.tagName.toLowerCase();
  const classes = Array.from(element.classList);
  if (classes.length === 0) return [];

  const elements: HTMLElement[] = [];
  classes.forEach((className) => {
    elements.push(
      ...(Array.from(
        document.querySelectorAll(`${selector}.${className}`)
      ) as HTMLElement[])
    );
  });
  return [...new Set(elements)];
};

const getXPath = (el: HTMLElement): string => {
  const parts: string[] = [];
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += `[@id="${el.id}"]`;
      parts.unshift(selector);
      break;
    } else {
      const sib = el.parentNode?.children;
      if (sib) {
        let index = 1;
        for (let i = 0; i < sib.length; i++) {
          if (sib[i] === el) break;
          if (sib[i].nodeName === el.nodeName) index++;
        }
        selector += `[${index}]`;
      }
      parts.unshift(selector);
      el = el.parentNode as HTMLElement;
    }
  }
  return "/" + parts.join("/");
};

const findXPathMatches = (element: HTMLElement): HTMLElement[] => {
  const baseXPath = getXPath(element);
  const pattern = baseXPath.replace(/\[\d+\]/g, "");
  const results = document.evaluate(
    pattern,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  const matches: HTMLElement[] = [];
  for (let i = 0; i < results.snapshotLength; i++) {
    matches.push(results.snapshotItem(i) as HTMLElement);
  }
  return matches;
};

const generateSelector = (el: HTMLElement): string => {
  const parts: string[] = [];
  let current = el;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      const cleanId = current.id.replace(/[[\]]/g, "\\$&");
      selector += `#${cleanId}`;
    }

    if (current.classList.length > 0) {
      const classes = Array.from(current.classList)
        .map((c) => c.replace(/[[\]]/g, "\\$&"))
        .join(".");
      selector += `.${classes}`;
    }

    if (current.getAttribute("role")) {
      selector += `[role="${current.getAttribute("role")}"]`;
    }

    const parent = current.parentElement;
    if (parent) {
      const similarSiblings = Array.from(parent.children).filter((sibling) => {
        if (sibling.tagName !== current.tagName) return false;
        if (sibling.classList.length !== current.classList.length) return false;
        return Array.from(current.classList).every((cls) =>
          sibling.classList.contains(cls)
        );
      });

      if (similarSiblings.length > 1) {
        const index = Array.from(parent.children).indexOf(current) + 1;
        if (index === 1) {
          selector += ":first-of-type";
        } else {
          selector += `:nth-of-type(${index})`;
        }
      }
    }

    parts.unshift(selector);
    current = current.parentElement as HTMLElement;
  }

  try {
    const fullSelector = parts.join(" > ");
    const parent = el.parentElement;
    if (parent) {
      const matches = Array.from(parent.querySelectorAll(fullSelector));
      if (matches.length === 1 && matches[0] === el) {
        return fullSelector;
      }
    }
    return generateSpecificSelector(el);
  } catch (e) {
    return generateSpecificSelector(el);
  }
};

const generateSpecificSelector = (el: HTMLElement): string => {
  const parts: string[] = [];
  let current = el;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList).join(".")}`;
    }

    if (current.getAttribute("role")) {
      selector += `[role="${current.getAttribute("role")}"]`;
    }

    const parent = current.parentElement;
    if (parent) {
      const sameTypeElements = Array.from(parent.children).filter(
        (child) => child.tagName === current.tagName
      );
      if (sameTypeElements.length > 1) {
        const index = sameTypeElements.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement as HTMLElement;
  }

  return parts.join(" > ");
};

const findSelectorMatches = (element: HTMLElement): HTMLElement[] => {
  const selector = generateSelector(element);
  return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
};

export const findChildMatches = async (
  parentMatches: HTMLElement[],
  childElement: HTMLElement,
  strategy?: MatchStrategy,
  maxMatches?: number
): Promise<MatchResult> => {
  if (!childElement || parentMatches.length === 0)
    return {
      strategy: "exact",
      matches: [],
    };

  // Get the relative path from parent to child
  const getRelativePath = (
    parent: HTMLElement,
    child: HTMLElement
  ): HTMLElement[] => {
    const path: HTMLElement[] = [];
    let current = child;
    while (current && current !== parent && current !== document.body) {
      path.unshift(current);
      current = current.parentElement as HTMLElement;
    }
    return path;
  };

  // Get the depth of the reference child relative to its parent
  const referenceParent = parentMatches.find((parent) =>
    parent.contains(childElement)
  );
  if (!referenceParent)
    return {
      strategy: "exact",
      matches: [],
    };
  const referenceDepth = getRelativePath(referenceParent, childElement).length;

  const findMatchesAtDepth = (
    potentialMatches: HTMLElement[]
  ): HTMLElement[] => {
    const matches = potentialMatches.filter((match) => {
      // Find the containing parent match
      const containingParent = parentMatches.find((parent) =>
        parent.contains(match)
      );
      if (!containingParent) return false;

      // Check if the match is at the same depth as the reference element
      const matchDepth = getRelativePath(containingParent, match).length;
      return matchDepth === referenceDepth;
    });

    // Group matches by parent
    const matchesByParent = new Map<HTMLElement, HTMLElement[]>();
    matches.forEach((match) => {
      const parent = parentMatches.find((p) => p.contains(match))!;
      if (!matchesByParent.has(parent)) {
        matchesByParent.set(parent, []);
      }
      matchesByParent.get(parent)!.push(match);
    });

    // Apply maxMatches limit per parent
    const limitedMatches: HTMLElement[] = [];
    matchesByParent.forEach((parentMatches, parent) => {
      limitedMatches.push(
        ...parentMatches.slice(0, maxMatches || parentMatches.length)
      );
    });

    return limitedMatches;
  };

  if (strategy) {
    const potentialMatches = await findMatches(childElement, strategy);
    return {
      strategy,
      matches: findMatchesAtDepth(potentialMatches),
    };
  }

  const strategies: MatchStrategy[] = ["exact", "similar", "xpath", "selector"];

  for (const strat of strategies) {
    const potentialMatches = await findMatches(childElement, strat);
    const validMatches = findMatchesAtDepth(potentialMatches);

    if (validMatches.length > 0) {
      return {
        strategy: strat,
        matches: validMatches,
      };
    }
  }

  return {
    strategy: "exact",
    matches: [],
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
