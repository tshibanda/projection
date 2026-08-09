"use client";

import { Slide, ShowStyle, VideoSource } from "@/lib/types";
import { hexToRgba } from "@/lib/color";

interface ProjectionCanvasProps {
  videoUrl: string | null;
  video: VideoSource;
  slide: Slide | null;
  style: ShowStyle;
  blackout: boolean;
}

const positionClasses: Record<ShowStyle["versePosition"], string> = {
  top: "items-start pt-[6%]",
  center: "items-center",
  bottom: "items-end pb-[6%]",
};

export default function ProjectionCanvas({
  videoUrl,
  video,
  slide,
  style,
  blackout,
}: ProjectionCanvasProps) {
  const versePosition = style.versePosition ?? "center";
  const referencePosition = style.referencePosition ?? "bottom";

  const bandBackground = style.bandImage
    ? {
        backgroundImage: `linear-gradient(${hexToRgba(style.bandColor, style.bandOpacity / 100)}, ${hexToRgba(style.bandColor, style.bandOpacity / 100)}), url(${style.bandImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { backgroundColor: hexToRgba(style.bandColor, style.bandOpacity / 100) };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
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
          className={`absolute inset-0 flex flex-col justify-center px-[6%] text-center ${positionClasses[versePosition]}`}
        >
          <div
            className={
              style.bandEnabled
                ? style.bandWidth === "full"
                  ? "w-full py-[3%]"
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
              style={{ fontSize: `${style.fontSize}vw`, color: style.textColor }}
            >
              {slide.text}
            </p>
          </div>
        </div>
      )}
      {!blackout && slide && style.showReference && (
        <div
          className={`absolute inset-0 flex flex-col justify-center px-[6%] text-center ${positionClasses[referencePosition]}`}
        >
          <p
            className={[
              style.showShadow ? "text-shadow-strong" : "",
              "font-sans uppercase tracking-widest text-accent2",
            ].join(" ")}
            style={{ fontSize: `${Math.max(style.fontSize * 0.32, 1)}vw` }}
          >
            {slide.reference}
            {slide.version ? ` · ${slide.version}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
