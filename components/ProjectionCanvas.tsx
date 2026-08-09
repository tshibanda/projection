"use client";

import { useCallback, useEffect, useRef } from "react";
import { Point, Slide, ShowStyle, BackgroundSource } from "@/lib/types";
import { hexToRgba } from "@/lib/color";

interface ProjectionCanvasProps {
  mediaUrl: string | null;
  background: BackgroundSource;
  slide: Slide | null;
  style: ShowStyle;
  blackout: boolean;
  editable?: boolean;
  // Called continuously while dragging, for immediate visual feedback only.
  onMoveVerse?: (p: Point) => void;
  onMoveReference?: (p: Point) => void;
  onMoveImage?: (p: Point) => void;
  // Called once when the drag ends, for persisting the final position.
  onVerseDragEnd?: (p: Point) => void;
  onReferenceDragEnd?: (p: Point) => void;
  onImageDragEnd?: (p: Point) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Clamps by the dragged element's own rendered size (not just its center
// point) so it can never be dragged far enough to get cropped by the
// canvas's overflow-hidden edge — moving an element never changes how
// much of it is visible.
function useDrag(
  containerRef: React.RefObject<HTMLDivElement>,
  onMove?: (p: Point) => void,
  onDragEnd?: (p: Point) => void
) {
  const dragging = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  const toPoint = useCallback(
    (e: React.PointerEvent): Point | null => {
      if (!containerRef.current) return null;
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const halfWPct = Math.min(50, (targetRect.width / 2 / containerRect.width) * 100);
      const halfHPct = Math.min(50, (targetRect.height / 2 / containerRect.height) * 100);
      const rawX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const rawY = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      return {
        x: clamp(rawX, halfWPct, 100 - halfWPct),
        y: clamp(rawY, halfHPct, 100 - halfHPct),
      };
    },
    [containerRef]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onMove) return;
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const p = toPoint(e);
      if (p) {
        lastPoint.current = p;
        onMove(p);
      }
    },
    [toPoint, onMove]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const p = toPoint(e);
      if (p) {
        lastPoint.current = p;
        onMove?.(p);
      }
    },
    [toPoint, onMove]
  );

  const onPointerUp = useCallback(() => {
    if (dragging.current && lastPoint.current) {
      onDragEnd?.(lastPoint.current);
    }
    dragging.current = false;
  }, [onDragEnd]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

export default function ProjectionCanvas({
  mediaUrl,
  background,
  slide,
  style,
  blackout,
  editable = false,
  onMoveVerse,
  onMoveReference,
  onMoveImage,
  onVerseDragEnd,
  onReferenceDragEnd,
  onImageDragEnd,
}: ProjectionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const verseDrag = useDrag(
    containerRef,
    editable ? onMoveVerse : undefined,
    editable ? onVerseDragEnd : undefined
  );
  const refDrag = useDrag(
    containerRef,
    editable ? onMoveReference : undefined,
    editable ? onReferenceDragEnd : undefined
  );
  const imageDrag = useDrag(
    containerRef,
    editable ? onMoveImage : undefined,
    editable ? onImageDragEnd : undefined
  );

  const versePos = style.versePos ?? { x: 50, y: 50 };
  const referencePos = style.referencePos ?? { x: 50, y: 88 };
  const imagePos = style.imagePos ?? { x: 50, y: 50 };
  const imageScale = style.imageScale ?? 100;
  const verseBoxWidth = style.verseBoxWidth ?? 88;
  const referenceBoxWidth = style.referenceBoxWidth ?? 88;
  const versePaddingY = style.versePaddingY ?? 0;
  const referencePaddingY = style.referencePaddingY ?? 0;

  const isImageBg = background.type === "imageFile" || background.type === "imageUrl";
  const isVideoBg = background.type === "videoFile" || background.type === "videoUrl";

  useEffect(() => {
    if (style.fontFamily !== "custom" || !style.customFontName || !style.customFontData) return;
    if (typeof document === "undefined" || !("fonts" in document)) return;
    const family = style.customFontName;
    const already = Array.from(document.fonts).some((f) => f.family === family);
    if (already) return;
    const face = new FontFace(family, `url(${style.customFontData})`);
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => {
        // Ignore malformed font files; the browser falls back to a default font.
      });
  }, [style.fontFamily, style.customFontName, style.customFontData]);

  const verseFontFamily =
    style.fontFamily === "custom" && style.customFontName ? `"${style.customFontName}"` : undefined;

  const bandBackground = style.bandImage
    ? {
        backgroundImage: `linear-gradient(${hexToRgba(style.bandColor, style.bandOpacity / 100)}, ${hexToRgba(style.bandColor, style.bandOpacity / 100)}), url(${style.bandImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: hexToRgba(style.bandColor, style.bandOpacity / 100) };

  // Only fall back to an opaque fill when there is genuinely nothing to
  // show. Otherwise stay transparent so a PNG's own alpha channel (or the
  // real desktop/OBS scene behind a live window) shows through instead of
  // a solid black rectangle.
  const rootIsOpaqueFallback = background.type === "none" && !style.transparentBg;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden [container-type:inline-size]"
      style={{ background: rootIsOpaqueFallback ? "#000" : "transparent" }}
    >
      {!blackout && isVideoBg && mediaUrl && (
        <video
          key={mediaUrl}
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!blackout && isImageBg && mediaUrl && (
        <div
          {...(editable ? imageDrag : {})}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${
            editable ? "cursor-move touch-none outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""
          }`}
          style={{ left: `${imagePos.x}%`, top: `${imagePos.y}%`, width: `${imageScale}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" className="block w-full" draggable={false} />
        </div>
      )}
      {!blackout && rootIsOpaqueFallback && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#141a2c] via-[#0b0f1a] to-[#191227]" />
      )}
      {!blackout && !style.transparentBg && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: style.overlayOpacity / 100 }}
        />
      )}
      {!blackout && slide && (
        <div
          {...(editable ? verseDrag : {})}
          className={`absolute -translate-x-1/2 -translate-y-1/2 text-center ${
            editable ? "cursor-move touch-none" : ""
          } ${editable ? "rounded-lg outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""}`}
          style={{ left: `${versePos.x}%`, top: `${versePos.y}%`, maxWidth: `${verseBoxWidth}%` }}
        >
          <div
            className={
              style.bandEnabled
                ? style.bandWidth === "full"
                  ? "w-full rounded-xl px-[4%] py-[3%]"
                  : "inline-block rounded-xl px-[4%] py-[2%]"
                : ""
            }
            style={style.bandEnabled ? bandBackground : undefined}
          >
            <p
              className={[
                style.fontFamily === "serif"
                  ? "font-serif italic"
                  : style.fontFamily === "sans"
                    ? "font-sans font-semibold"
                    : "",
                style.showOutline ? "text-outline" : "",
                style.showShadow ? "text-shadow-strong" : "",
                "leading-tight transition-opacity duration-300",
              ].join(" ")}
              style={{
                fontSize: `${style.fontSize}cqw`,
                color: style.textColor,
                fontFamily: verseFontFamily,
                paddingTop: `${versePaddingY}cqw`,
                paddingBottom: `${versePaddingY}cqw`,
              }}
            >
              {slide.text}
            </p>
          </div>
        </div>
      )}
      {!blackout && slide && style.showReference && (
        <div
          {...(editable ? refDrag : {})}
          className={`absolute -translate-x-1/2 -translate-y-1/2 text-center ${
            editable ? "cursor-move touch-none rounded-lg outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""
          }`}
          style={{ left: `${referencePos.x}%`, top: `${referencePos.y}%`, maxWidth: `${referenceBoxWidth}%` }}
        >
          <p
            className={[
              style.showShadow ? "text-shadow-strong" : "",
              "font-sans uppercase tracking-widest",
            ].join(" ")}
            style={{
              fontSize: `${Math.max(style.fontSize * 0.32, 1)}cqw`,
              color: style.referenceColor ?? "#22d3ee",
              paddingTop: `${referencePaddingY}cqw`,
              paddingBottom: `${referencePaddingY}cqw`,
            }}
          >
            {slide.reference}
            {slide.version ? ` (${slide.version})` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
