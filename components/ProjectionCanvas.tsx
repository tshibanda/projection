"use client";

import { useCallback, useEffect, useRef } from "react";
import { Point, Slide, ShowStyle, BackgroundSource } from "@/lib/types";
import { hexToRgba } from "@/lib/color";

export interface BoxSize {
  width: number;
  height: number;
}

interface ProjectionCanvasProps {
  mediaUrl: string | null;
  background: BackgroundSource;
  slide: Slide | null;
  style: ShowStyle;
  blackout: boolean;
  editable?: boolean;
  // Called continuously while dragging/resizing, for immediate visual feedback only.
  onMoveVerse?: (p: Point) => void;
  onMoveReference?: (p: Point) => void;
  onMoveImage?: (p: Point) => void;
  onResizeVerse?: (s: BoxSize) => void;
  onResizeReference?: (s: BoxSize) => void;
  // Called once when the gesture ends, for persisting the final value.
  onVerseDragEnd?: (p: Point) => void;
  onReferenceDragEnd?: (p: Point) => void;
  onImageDragEnd?: (p: Point) => void;
  onVerseResizeEnd?: (s: BoxSize) => void;
  onReferenceResizeEnd?: (s: BoxSize) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const DRAG_THRESHOLD_PX = 4;

// Clamps by the dragged element's own rendered size (not just its center
// point) so it can never be dragged far enough to get cropped by the
// canvas's overflow-hidden edge — moving an element never changes how
// much of it is visible. A plain click (no real movement) never
// repositions anything, only an actual drag past a small threshold does.
function useDrag(
  containerRef: React.RefObject<HTMLDivElement>,
  onMove?: (p: Point) => void,
  onDragEnd?: (p: Point) => void
) {
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
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
      pointerDownAt.current = { x: e.clientX, y: e.clientY };
      dragging.current = false;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [onMove]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDownAt.current) return;
      if (!dragging.current) {
        const dx = e.clientX - pointerDownAt.current.x;
        const dy = e.clientY - pointerDownAt.current.y;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        dragging.current = true;
      }
      const p = toPoint(e);
      if (p) {
        lastPoint.current = p;
        onMove?.(p);
      }
    },
    [toPoint]
  );

  const onPointerUp = useCallback(() => {
    if (dragging.current && lastPoint.current) {
      onDragEnd?.(lastPoint.current);
    }
    pointerDownAt.current = null;
    dragging.current = false;
  }, [onDragEnd]);

  return { onPointerDown, onPointerMove, onPointerUp };
}

type ResizeAxis = "width" | "height";

// One edge handle resizes a single axis (width from the left/right edges,
// height from the top/bottom edges), symmetrically from the box's centered
// anchor, so the box's on-screen footprint is entirely user-controlled and
// never shifts based on how much text it holds. Deliberately separate from
// useDrag so that moving a box (anywhere on it) never resizes it, and
// resizing (only from a handle) never moves it.
function useEdgeResize(
  containerRef: React.RefObject<HTMLDivElement>,
  axis: ResizeAxis,
  invert: boolean,
  getStart: () => BoxSize,
  onResize?: (s: BoxSize) => void,
  onResizeEnd?: (s: BoxSize) => void
) {
  const start = useRef<{ x: number; y: number; size: BoxSize } | null>(null);
  const last = useRef<BoxSize | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!onResize) return;
      start.current = { x: e.clientX, y: e.clientY, size: getStart() };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getStart, onResize]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (!start.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dxPct = ((e.clientX - start.current.x) / rect.width) * 100;
      const dyPct = ((e.clientY - start.current.y) / rect.height) * 100;
      const raw = axis === "width" ? dxPct : dyPct;
      const delta = (invert ? -raw : raw) * 2;
      const next: BoxSize =
        axis === "width"
          ? { ...start.current.size, width: clamp(start.current.size.width + delta, 15, 100) }
          : { ...start.current.size, height: clamp(start.current.size.height + delta, 5, 95) };
      last.current = next;
      onResize?.(next);
    },
    [containerRef, axis, invert]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      if (start.current && last.current) {
        onResizeEnd?.(last.current);
      }
      start.current = null;
      last.current = null;
    },
    [onResizeEnd]
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}

const EDGE_HANDLE_POSITION: Record<"top" | "bottom" | "left" | "right", string> = {
  top: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
  bottom: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize",
  left: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
  right: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
};

function EdgeHandle({
  position,
  handlers,
}: {
  position: "top" | "bottom" | "left" | "right";
  handlers: ReturnType<typeof useEdgeResize>;
}) {
  return (
    <div
      {...handlers}
      title="Redimensionner"
      className={`absolute h-3 w-3 touch-none rounded-full border border-white/40 bg-accent shadow ${EDGE_HANDLE_POSITION[position]}`}
    />
  );
}

function ResizeHandles({
  containerRef,
  getStart,
  onResize,
  onResizeEnd,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  getStart: () => BoxSize;
  onResize?: (s: BoxSize) => void;
  onResizeEnd?: (s: BoxSize) => void;
}) {
  const top = useEdgeResize(containerRef, "height", true, getStart, onResize, onResizeEnd);
  const bottom = useEdgeResize(containerRef, "height", false, getStart, onResize, onResizeEnd);
  const left = useEdgeResize(containerRef, "width", true, getStart, onResize, onResizeEnd);
  const right = useEdgeResize(containerRef, "width", false, getStart, onResize, onResizeEnd);
  return (
    <>
      <EdgeHandle position="top" handlers={top} />
      <EdgeHandle position="bottom" handlers={bottom} />
      <EdgeHandle position="left" handlers={left} />
      <EdgeHandle position="right" handlers={right} />
    </>
  );
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
  onResizeVerse,
  onResizeReference,
  onVerseDragEnd,
  onReferenceDragEnd,
  onImageDragEnd,
  onVerseResizeEnd,
  onReferenceResizeEnd,
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
  const verseBoxHeight = style.verseBoxHeight ?? 40;
  const referenceBoxHeight = style.referenceBoxHeight ?? 12;
  const referenceFontSize = style.referenceFontSize ?? Math.max(style.fontSize * 0.32, 1);

  const getVerseSize = useCallback(
    () => ({ width: verseBoxWidth, height: verseBoxHeight }),
    [verseBoxWidth, verseBoxHeight]
  );
  const getReferenceSize = useCallback(
    () => ({ width: referenceBoxWidth, height: referenceBoxHeight }),
    [referenceBoxWidth, referenceBoxHeight]
  );

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

  const referenceFontFamilyChoice = style.referenceFontFamily ?? "sans";
  const referenceFontFamily =
    referenceFontFamilyChoice === "custom" && style.customFontName ? `"${style.customFontName}"` : undefined;
  const referenceFontFamilyClass =
    referenceFontFamilyChoice === "serif"
      ? "font-serif italic"
      : referenceFontFamilyChoice === "custom"
        ? ""
        : "font-sans";

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
  // a solid black rectangle. Blackout always wins: it must produce a fully
  // transparent frame regardless of the show's own background settings, so
  // an OBS Image Source reading VerseFlowLIVERender.png shows nothing at
  // all rather than an opaque black square covering the scene beneath it.
  const rootIsOpaqueFallback = !blackout && background.type === "none" && !style.transparentBg;

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
      {/* The dark veil is a flat layer, so it would mask a PNG's own alpha
          wherever it's laid over the image — it's scoped to video only, the
          one background type that's always fully opaque anyway. */}
      {!blackout && !style.transparentBg && isVideoBg && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: style.overlayOpacity / 100 }}
        />
      )}
      {!blackout && slide && (
        <div
          {...(editable ? verseDrag : {})}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${
            editable ? "cursor-move touch-none" : ""
          } ${editable ? "rounded-lg outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""}`}
          style={{
            left: `${versePos.x}%`,
            top: `${versePos.y}%`,
            width: `${verseBoxWidth}%`,
            height: `${verseBoxHeight}%`,
          }}
        >
          {/* Clipping lives on this inner wrapper, not the box itself, so the
              resize handles (anchored on the box's own border) stay fully
              interactive instead of being clipped along with overflow text. */}
          <div
            className={`flex h-full w-full flex-col justify-center overflow-hidden ${
              style.verseTextAlign === "right"
                ? "items-end text-right"
                : style.verseTextAlign === "center"
                  ? "items-center text-center"
                  : "items-start text-left"
            }`}
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
                }}
              >
                {slide.text}
              </p>
            </div>
          </div>
          {editable && (
            <ResizeHandles
              containerRef={containerRef}
              getStart={getVerseSize}
              onResize={onResizeVerse}
              onResizeEnd={onVerseResizeEnd}
            />
          )}
        </div>
      )}
      {!blackout && slide && style.showReference && (
        <div
          {...(editable ? refDrag : {})}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${
            editable ? "cursor-move touch-none rounded-lg outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""
          }`}
          style={{
            left: `${referencePos.x}%`,
            top: `${referencePos.y}%`,
            width: `${referenceBoxWidth}%`,
            height: `${referenceBoxHeight}%`,
          }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden text-center">
            <p
              className={[
                style.showShadow ? "text-shadow-strong" : "",
                referenceFontFamilyClass,
                "uppercase tracking-widest",
              ].join(" ")}
              style={{
                fontSize: `${referenceFontSize}cqw`,
                color: style.referenceColor ?? "#22d3ee",
                fontFamily: referenceFontFamily,
              }}
            >
              {slide.reference}
              {slide.version ? ` (${slide.version})` : ""}
            </p>
          </div>
          {editable && (
            <ResizeHandles
              containerRef={containerRef}
              getStart={getReferenceSize}
              onResize={onResizeReference}
              onResizeEnd={onReferenceResizeEnd}
            />
          )}
        </div>
      )}
    </div>
  );
}
