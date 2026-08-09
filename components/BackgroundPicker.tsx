"use client";

import { useRef, useState } from "react";
import { BackgroundSource } from "@/lib/types";

interface BackgroundPickerProps {
  background: BackgroundSource;
  onVideoFile: (file: File) => void;
  onVideoUrl: (url: string) => void;
  onImageFile: (file: File) => void;
  onImageUrl: (url: string) => void;
  onClear: () => void;
}

const isVideoType = (t: BackgroundSource["type"]) => t === "videoFile" || t === "videoUrl";
const isImageType = (t: BackgroundSource["type"]) => t === "imageFile" || t === "imageUrl";

export default function BackgroundPicker({
  background,
  onVideoFile,
  onVideoUrl,
  onImageFile,
  onImageUrl,
  onClear,
}: BackgroundPickerProps) {
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"video" | "image">(isImageType(background.type) ? "image" : "video");
  const [videoUrlDraft, setVideoUrlDraft] = useState(background.type === "videoUrl" ? background.url : "");
  const [imageUrlDraft, setImageUrlDraft] = useState(background.type === "imageUrl" ? background.url : "");

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/80">Fond</h3>

      <div className="mb-3 flex gap-2">
        {(["video", "image"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
              tab === t
                ? "border-accent bg-accent/20 text-white"
                : "border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            {t === "video" ? "Vidéo" : "Image"}
          </button>
        ))}
      </div>

      {tab === "video" ? (
        <>
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onVideoFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => videoFileInputRef.current?.click()}
            className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Importer un fichier vidéo…
          </button>
          <p className="mt-1.5 text-xs text-white/35">
            Un fichier importé n&apos;est visible que dans ce navigateur. Pour OBS ou un
            autre appareil, utilisez plutôt une URL vidéo.
          </p>

          <div className="my-3 flex items-center gap-2 text-xs text-white/30">
            <div className="h-px flex-1 bg-white/10" />
            ou
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex gap-2">
            <input
              value={videoUrlDraft}
              onChange={(e) => setVideoUrlDraft(e.target.value)}
              placeholder="URL d'une vidéo (.mp4, .webm)"
              className="flex-1 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => videoUrlDraft.trim() && onVideoUrl(videoUrlDraft.trim())}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
            >
              OK
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageFile(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => imageFileInputRef.current?.click()}
            className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Importer une image…
          </button>
          <p className="mt-1.5 text-xs text-white/35">
            Un fichier importé n&apos;est visible que dans ce navigateur. Pour OBS ou un
            autre appareil, utilisez plutôt une URL image.
          </p>

          <div className="my-3 flex items-center gap-2 text-xs text-white/30">
            <div className="h-px flex-1 bg-white/10" />
            ou
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex gap-2">
            <input
              value={imageUrlDraft}
              onChange={(e) => setImageUrlDraft(e.target.value)}
              placeholder="URL d'une image (.jpg, .png, .webp)"
              className="flex-1 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={() => imageUrlDraft.trim() && onImageUrl(imageUrlDraft.trim())}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
            >
              OK
            </button>
          </div>
        </>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <span>
          {background.type === "videoFile" && `Vidéo : ${background.name}`}
          {background.type === "videoUrl" && `Vidéo (URL) : ${background.url}`}
          {background.type === "imageFile" && `Image : ${background.name}`}
          {background.type === "imageUrl" && `Image (URL) : ${background.url}`}
          {background.type === "none" && "Aucun fond sélectionné"}
        </span>
        {background.type !== "none" && (
          <button onClick={onClear} className="text-red-400/70 hover:underline">
            Retirer
          </button>
        )}
      </div>
    </div>
  );
}
