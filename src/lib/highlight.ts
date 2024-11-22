const COLORS = {
  DEFAULT: "#4a90e2", // Blue
  SELECTED: "#ff4444", // Red
  MATCHES: "#ffd700", // Yellow
} as const;

const OPACITIES = {
  HOVER: "40", // 25% opacity in hex
  NORMAL: "20", // 12% opacity in hex
} as const;

const transition = "background-color 0.10s ease-in-out";

type HighlightStyles = {
  outline: string;
  outlineOffset: string;
  backgroundColor: string;
  transition: string;
};

// WeakMap to store original styles - automatically garbage collects when elements are removed
const originalStyles = new WeakMap<HTMLElement, Partial<HighlightStyles>>();

const createHighlightStyles = (
  color: string,
  opacity: string = OPACITIES.NORMAL
): HighlightStyles => ({
  outline: `2px solid ${color}`,
  outlineOffset: "1px",
  backgroundColor: `${color}${opacity}`,
  transition,
});

const storeOriginalStyles = (element: HTMLElement) => {
  if (!originalStyles.has(element)) {
    const computedStyle = window.getComputedStyle(element);
    originalStyles.set(element, {
      outline: computedStyle.outline,
      outlineOffset: computedStyle.outlineOffset,
      backgroundColor: computedStyle.backgroundColor,
      transition: computedStyle.transition,
    });
  }
};

const applyStyles = (
  element: HTMLElement,
  styles: Partial<HighlightStyles>
) => {
  storeOriginalStyles(element);
  Object.assign(element.style, styles);
};

export const highlightElement = (
  element: HTMLElement | null,
  color: string = COLORS.DEFAULT
) => {
  if (!element) return;
  applyStyles(element, createHighlightStyles(color));
};

export const highlightHoveredElement = (
  element: HTMLElement,
  isSelected: boolean
) => {
  if (isSelected) {
    highlightElement(element, COLORS.SELECTED);
  } else {
    applyStyles(element, {
      outline: `2px dashed ${COLORS.DEFAULT}`,
      outlineOffset: "1px",
      backgroundColor: `${COLORS.DEFAULT}${OPACITIES.HOVER}`,
      transition,
    });
  }
};

export const highlightSelectedElement = (element: HTMLElement) => {
  highlightElement(element, COLORS.SELECTED);
};

export const highlightMatches = (matches: HTMLElement[]) => {
  matches.forEach((element) => highlightElement(element, COLORS.MATCHES));
};

export const clearHighlight = (element: HTMLElement | null) => {
  if (!element) return;
  const original = originalStyles.get(element);
  if (original) {
    applyStyles(element, original);
    originalStyles.delete(element);
  } else {
    // Fallback to empty styles if no original styles were stored
    applyStyles(element, {
      outline: "",
      outlineOffset: "",
      backgroundColor: "",
      transition: "",
    });
  }
};

export const clearHighlights = (elements: HTMLElement[]) => {
  elements.forEach(clearHighlight);
};
