let measureCtx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  return measureCtx;
}

export function wrapLines(text: string, maxWidthPx: number, font: string): string[] {
  const ctx = getCtx();
  const words = text.split(/\s+/).filter(Boolean);
  if (!ctx || words.length === 0) return words.length ? [text] : [];
  ctx.font = font;
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(candidate).width <= maxWidthPx) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface FitBoxParams {
  maxWidthPx: number;
  maxHeightPx: number;
  fontSizePx: number;
  fontFamily: string;
  lineHeight: number; // multiplier of fontSizePx
}

// Greedily word-wraps `text` at maxWidthPx, then keeps only as many lines as
// fit within maxHeightPx. Anything left over is returned as `rest`, meant to
// flow into a continuation slide. Fails open (fitting = full text, rest =
// "") when measurement isn't possible (e.g. server-side, or a zero-size box).
export function splitTextToFit(text: string, params: FitBoxParams): { fitting: string; rest: string } {
  if (typeof document === "undefined" || params.maxWidthPx <= 0 || params.maxHeightPx <= 0) {
    return { fitting: text, rest: "" };
  }
  const font = `${Math.max(1, Math.round(params.fontSizePx))}px ${params.fontFamily}`;
  const lines = wrapLines(text, params.maxWidthPx, font);
  const capacity = Math.max(1, Math.floor(params.maxHeightPx / (params.fontSizePx * params.lineHeight)));
  if (lines.length <= capacity) return { fitting: text, rest: "" };
  return {
    fitting: lines.slice(0, capacity).join(" "),
    rest: lines.slice(capacity).join(" "),
  };
}
