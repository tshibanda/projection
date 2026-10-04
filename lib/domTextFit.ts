"use client";

// Measures text with a real, hidden DOM element using the exact CSS the
// verse box renders with (same font family/weight/style, line-height,
// width) instead of estimating via canvas text metrics — canvas
// measureText doesn't always agree with how the browser actually lays out
// and wraps text (kerning, font fallback, line-height rounding), which
// could let a verse the studio predicted would fit still get clipped in
// the real render. Real DOM layout can't diverge from itself.

let measureEl: HTMLParagraphElement | null = null;

function getMeasureEl(): HTMLParagraphElement | null {
  if (typeof document === "undefined") return null;
  if (measureEl && document.body.contains(measureEl)) return measureEl;
  const el = document.createElement("p");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.left = "-99999px";
  el.style.top = "0";
  el.style.margin = "0";
  el.style.whiteSpace = "normal";
  el.style.wordBreak = "normal";
  document.body.appendChild(el);
  measureEl = el;
  return el;
}

export interface DomFitParams {
  maxWidthPx: number;
  maxHeightPx: number;
  fontSizePx: number;
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight: number; // multiplier of fontSizePx
}

function applyStyle(el: HTMLParagraphElement, params: DomFitParams) {
  el.style.width = `${Math.max(1, params.maxWidthPx)}px`;
  el.style.fontSize = `${Math.max(1, params.fontSizePx)}px`;
  el.style.fontFamily = params.fontFamily;
  el.style.fontWeight = params.fontWeight ?? "normal";
  el.style.fontStyle = params.fontStyle ?? "normal";
  el.style.lineHeight = String(params.lineHeight);
}

function heightOf(words: string[], count: number, el: HTMLParagraphElement): number {
  el.textContent = words.slice(0, count).join(" ");
  return el.scrollHeight;
}

// Greedily finds the longest word-boundary-aligned prefix of `text` that
// fits within maxWidthPx x maxHeightPx, given the exact font it will
// render with. Anything left over is returned as `rest`, meant to flow
// into a continuation slide. Fails open (fitting = full text, rest = "")
// when measurement isn't possible (server-side, or a zero-size box).
export function splitTextToFitDom(text: string, params: DomFitParams): { fitting: string; rest: string } {
  const el = getMeasureEl();
  if (!el || params.maxWidthPx <= 0 || params.maxHeightPx <= 0) {
    return { fitting: text, rest: "" };
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { fitting: text, rest: "" };

  applyStyle(el, params);
  const tolerance = 0.5;
  if (heightOf(words, words.length, el) <= params.maxHeightPx + tolerance) {
    return { fitting: text, rest: "" };
  }

  // Binary search the largest word count that still fits. At least one
  // word is always kept, even if it alone overflows — there's no smaller
  // unit to fall back to.
  let lo = 1;
  let hi = words.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (heightOf(words, mid, el) <= params.maxHeightPx + tolerance) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return {
    fitting: words.slice(0, lo).join(" "),
    rest: words.slice(lo).join(" "),
  };
}
