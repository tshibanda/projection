"use client";

import { get, set, del } from "idb-keyval";

const keyFor = (showId: string) => `verseflow-video:${showId}`;

export async function storeVideoBlob(showId: string, file: File): Promise<void> {
  await set(keyFor(showId), file);
}

export async function loadVideoBlob(showId: string): Promise<Blob | undefined> {
  return get(keyFor(showId));
}

export async function removeVideoBlob(showId: string): Promise<void> {
  await del(keyFor(showId));
}
