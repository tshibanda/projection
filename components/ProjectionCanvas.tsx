"use client";

import { useCallback, useRef } from "react";
import { Point, Slide, ShowStyle, VideoSource } from "@/lib/types";
import { hexToRgba } from "@/lib/color";

interface ProjectionCanvasProps {
  videoUrl: string | null;
  video: VideoSource;
  slide: Slide | null;
  style: ShowStyle;
  blackout: boolean;
  editable?: boolean;
  // Called continuously while dragging, for immediate visual feedback only.
  onMoveVerse?: (p: Point) => void;
  onMoveReference?: (p: Point) => void;
  // Called once when the drag ends, for persisting the final position.
  onVerseDragEnd?: (p: Point) => void;
  onReferenceDragEnd?: (p: Point) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function useDrag(
  containerRef: React.RefObject<HTMLDivElement>,
  onMove?: (p: Point) => void,
  onDragEnd?: (p: Point) => void
) {
  const dragging = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  const toPoint = useCallback(
    (clientX: number, clientY: number): Point | null => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
        y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
      };
    },
    [containerRef]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onMove) return;
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const p = toPoint(e.clientX, e.clientY);
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
      const p = toPoint(e.clientX, e.clientY);
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
  videoUrl,
  video,
  slide,
  style,
  blackout,
  editable = false,
  onMoveVerse,
  onMoveReference,
  onVerseDragEnd,
  onReferenceDragEnd,
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

  const versePos = style.versePos ?? { x: 50, y: 50 };
  const referencePos = style.referencePos ?? { x: 50, y: 88 };

  const bandBackground = style.bandImage
    ? {
        backgroundImage: `linear-gradient(${hexToRgba(style.bandColor, style.bandOpacity / 100)}, ${hexToRgba(style.bandColor, style.bandOpacity / 100)}), url(${style.bandImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: hexToRgba(style.bandColor, style.bandOpacity / 100) };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden [container-type:inline-size]"
      style={{ background: style.transparentBg ? "transparent" : "#000" }}
    >
      {!blackout && !style.transparentBg && videoUrl && (
        <video
          key={videoUrl}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!blackout && !style.transparentBg && !videoUrl && video.type === "none" && (
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
          className={`absolute max-w-[88%] -translate-x-1/2 -translate-y-1/2 text-center ${
            editable ? "cursor-move touch-none" : ""
          } ${editable ? "rounded-lg outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""}`}
          style={{ left: `${versePos.x}%`, top: `${versePos.y}%` }}
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
                style.fontFamily === "serif" ? "font-serif italic" : "font-sans font-semibold",
                style.showOutline ? "text-outline" : "",
                style.showShadow ? "text-shadow-strong" : "",
                "leading-tight transition-opacity duration-300",
              ].join(" ")}
              style={{ fontSize: `${style.fontSize}cqw`, color: style.textColor }}
            >
              {slide.text}
            </p>
          </div>
        </div>
      )}
      {!blackout && slide && style.showReference && (
        <div
          {...(editable ? refDrag : {})}
          className={`absolute max-w-[88%] -translate-x-1/2 -translate-y-1/2 text-center ${
            editable ? "cursor-move touch-none rounded-lg outline-dashed outline-1 outline-white/25 hover:outline-accent" : ""
          }`}
          style={{ left: `${referencePos.x}%`, top: `${referencePos.y}%` }}
        >
          <p
            className={[
              style.showShadow ? "text-shadow-strong" : "",
              "font-sans uppercase tracking-widest text-accent2",
            ].join(" ")}
            style={{ fontSize: `${Math.max(style.fontSize * 0.32, 1)}cqw` }}
          >
            {slide.reference}
            {slide.version ? ` · ${slide.version}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
