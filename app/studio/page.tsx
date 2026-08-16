"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Show } from "@/lib/types";
import { createShow, deleteShow, listShows } from "@/lib/store";
import { pushLiveState } from "@/lib/liveSync";

export default function StudioHome() {
  const router = useRouter();
  const [shows, setShows] = useState<Show[] | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    setShows(listShows());
  }, []);

  const handleCreate = () => {
    const show = createShow(newTitle.trim() || "Nouvelle présentation");
    router.push(`/studio/${show.id}`);
  };

  const handleDelete = (id: string) => {
    deleteShow(id);
    setShows(listShows());
  };

  // Instead of opening a live window, pushes this presentation's first
  // slide into the render pipeline (desktop app only): a hidden window
  // mirrors it and snapshots VerseFlowLIVERender.png for OBS Image Source
  // setups. Every presentation writes to that same file.
  const handleLive = (show: Show) => {
    pushLiveState(show.id, { show, slideIndex: 0, blackout: false });
  };

  return (
    <main className="min-h-screen bg-ink px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent to-accent2" />
            <span className="font-semibold">VerseFlow</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Vos présentations</h1>
        <p className="mt-1 text-sm text-white/50">
          Créez une présentation pour préparer votre vidéo de fond et votre déroulé de versets.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Ex: Culte du dimanche 9 août"
            className="flex-1 rounded-lg border border-white/10 bg-panel px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={handleCreate}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
          >
            + Nouvelle présentation
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {shows === null && (
            <p className="text-sm text-white/40">Chargement…</p>
          )}
          {shows?.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
              Aucune présentation pour le moment. Créez-en une ci-dessus.
            </div>
          )}
          {shows?.map((show) => (
            <div
              key={show.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-panel px-5 py-4 hover:border-white/20"
            >
              <Link href={`/studio/${show.id}`} className="flex-1">
                <p className="font-medium">{show.title}</p>
                <p className="mt-0.5 text-xs text-white/40">
                  {show.slides.length} verset{show.slides.length !== 1 ? "s" : ""} ·
                  {" "}
                  {new Date(show.updatedAt).toLocaleString("fr-FR")}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLive(show)}
                  title="Envoie ce verset vers VerseFlowLIVERender.png (bureau), sans ouvrir de fenêtre"
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                >
                  Live ↗
                </button>
                <button
                  onClick={() => handleDelete(show.id)}
                  className="rounded-lg px-2 py-1.5 text-xs text-red-400/70 hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
