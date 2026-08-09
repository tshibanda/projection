"use client";

import { Show, ShowStyle, Slide, defaultStyle } from "./types";

const INDEX_KEY = "verseflow:shows:index";
const showKey = (id: string) => `verseflow:show:${id}`;

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function listShows(): Show[] {
  return readIndex()
    .map((id) => getShow(id))
    .filter((s): s is Show => !!s)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getShow(id: string): Show | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(showKey(id));
    return raw ? (JSON.parse(raw) as Show) : null;
  } catch {
    return null;
  }
}

export function saveShow(show: Show) {
  show.updatedAt = Date.now();
  localStorage.setItem(showKey(show.id), JSON.stringify(show));
  const ids = readIndex();
  if (!ids.includes(show.id)) {
    ids.push(show.id);
    writeIndex(ids);
  }
}

export function deleteShow(id: string) {
  localStorage.removeItem(showKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
}

export function createShow(title: string): Show {
  const now = Date.now();
  const show: Show = {
    id: crypto.randomUUID(),
    title: title || "Nouvelle présentation",
    createdAt: now,
    updatedAt: now,
    slides: [],
    style: { ...defaultStyle },
    video: { type: "none" },
  };
  saveShow(show);
  return show;
}

export function newSlide(reference: string, text: string, version: string): Slide {
  return { id: crypto.randomUUID(), reference, text, version };
}

export function updateShowStyle(show: Show, patch: Partial<ShowStyle>): Show {
  const next = { ...show, style: { ...show.style, ...patch } };
  saveShow(next);
  return next;
}
