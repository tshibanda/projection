"use client";

import { ShowStyle } from "./types";

export interface StylePreset {
  id: string;
  name: string;
  style: ShowStyle;
  createdAt: number;
}

const KEY = "verseflow:style-presets";

function read(): StylePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StylePreset[]) : [];
  } catch {
    return [];
  }
}

function write(presets: StylePreset[]) {
  localStorage.setItem(KEY, JSON.stringify(presets));
}

export function listStylePresets(): StylePreset[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveStylePreset(name: string, style: ShowStyle): StylePreset | null {
  const preset: StylePreset = { id: crypto.randomUUID(), name, style, createdAt: Date.now() };
  try {
    write([...read(), preset]);
    return preset;
  } catch {
    return null;
  }
}

export function deleteStylePreset(id: string) {
  write(read().filter((p) => p.id !== id));
}
