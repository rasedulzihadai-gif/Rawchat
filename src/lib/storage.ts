"use client";

import type { CustomProvider } from "./providers";

const KEYS = "rawchat.keys";
const CUSTOM = "rawchat.customProviders";
const ACTIVE = "rawchat.active"; // { providerId, model, mode }
const CUSTOM_MODELS = "rawchat.customModels"; // { [providerId]: string[] }

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* quota / privacy mode */
  }
}

export const store = {
  getKeys(): Record<string, string> {
    return read(KEYS, {});
  },
  setKey(providerId: string, key: string) {
    const keys = store.getKeys();
    if (key) keys[providerId] = key;
    else delete keys[providerId];
    write(KEYS, keys);
  },
  getAccountIds(): Record<string, string> {
    return read("rawchat.accountIds", {});
  },
  setAccountId(providerId: string, id: string) {
    const all = store.getAccountIds();
    if (id) all[providerId] = id;
    else delete all[providerId];
    write("rawchat.accountIds", all);
  },
  getCustomProviders(): CustomProvider[] {
    return read(CUSTOM, []);
  },
  setCustomProviders(list: CustomProvider[]) {
    write(CUSTOM, list);
  },
  getCustomModels(): Record<string, string[]> {
    return read(CUSTOM_MODELS, {});
  },
  setCustomModelsFor(providerId: string, models: string[]) {
    const all = store.getCustomModels();
    all[providerId] = models;
    write(CUSTOM_MODELS, all);
  },
  getActive(): { providerId: string; model: string; mode: string; accountId?: string } | null {
    return read(ACTIVE, null);
  },
  setActive(v: { providerId: string; model: string; mode: string; accountId?: string }) {
    write(ACTIVE, v);
  },
  wipe() {
    if (typeof window === "undefined") return;
    [KEYS, CUSTOM, ACTIVE, CUSTOM_MODELS, "rawchat.accountIds"].forEach((k) =>
      window.localStorage.removeItem(k),
    );
  },
};
