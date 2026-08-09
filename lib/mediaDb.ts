"use client";

import { get, set, del } from "idb-keyval";

// Key prefix kept as "-video-" for backward compatibility with blobs
// stored before background images were supported.
const keyFor = (showId: string) => `verseflow-video:${showId}`;

export async function storeMediaBlob(showId: string, file: File): Promise<void> {
  await set(keyFor(showId), file);
}

export async function loadMediaBlob(showId: string): Promise<Blob | undefined> {
  return get(keyFor(showId));
}

export async function removeMediaBlob(showId: string): Promise<void> {
  await del(keyFor(showId));
}
