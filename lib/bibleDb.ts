"use client";

import { get, set, del } from "idb-keyval";
import { ImportedVerse } from "./bibleParse";

const NAMES_KEY = "verseflow:bible-versions";
const keyFor = (name: string) => `verseflow-bible:${name}`;

function readNames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NAMES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeNames(names: string[]) {
  localStorage.setItem(NAMES_KEY, JSON.stringify(names));
}

export function listImportedVersionNames(): string[] {
  return readNames();
}

export async function storeBibleVersion(name: string, verses: ImportedVerse[]): Promise<void> {
  await set(keyFor(name), verses);
  const names = readNames();
  if (!names.includes(name)) {
    writeNames([...names, name]);
  }
}

export async function loadBibleVersion(name: string): Promise<ImportedVerse[] | undefined> {
  return get(keyFor(name));
}

export async function removeBibleVersion(name: string): Promise<void> {
  await del(keyFor(name));
  writeNames(readNames().filter((n) => n !== name));
}
