"use client";

import { useRef, useState } from "react";
import { VideoSource } from "@/lib/types";

interface VideoPickerProps {
  video: VideoSource;
  onFile: (file: File) => void;
  onUrl: (url: string) => void;
  onClear: () => void;
}

export default function VideoPicker({ video, onFile, onUrl, onClear }: VideoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState(video.type === "url" ? video.url : "");

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/80">Vidéo de fond</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
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
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="URL d'une vidéo (.mp4, .webm)"
          className="flex-1 rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={() => urlDraft.trim() && onUrl(urlDraft.trim())}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          OK
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <span>
          {video.type === "file" && `Fichier : ${video.name}`}
          {video.type === "url" && `URL : ${video.url}`}
          {video.type === "none" && "Aucune vidéo sélectionnée"}
        </span>
        {video.type !== "none" && (
          <button onClick={onClear} className="text-red-400/70 hover:underline">
            Retirer
          </button>
        )}
      </div>
    </div>
  );
}
