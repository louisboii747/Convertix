"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getEnabledConversionPairs } from "./formats";
import { parseSavedRoutes } from "./route-shortcuts";

const savedKey = "convertix_saved_conversions";
const recentKey = "convertix_recent_tools";
const eventName = "convertix:shortcuts-updated";
const allowedConversions = new Set(
  getEnabledConversionPairs().map((pair) => `/${pair.slug}`),
);
const allowedRecent = new Set([
  ...allowedConversions,
  "/compress-pdf",
  "/compress-image",
  "/merge-pdf",
  "/optimize-svg",
]);
const fallback: Record<string, string> = {};
const memoryOnly = new Set<string>();

function read(key: string) {
  if (memoryOnly.has(key)) return fallback[key] ?? "";
  try {
    const storage = key === savedKey ? localStorage : sessionStorage;
    return storage.getItem(key) ?? "";
  } catch {
    return fallback[key] ?? "";
  }
}

function write(key: string, routes: string[]) {
  const value = JSON.stringify(routes);
  fallback[key] = value;
  try {
    const storage = key === savedKey ? localStorage : sessionStorage;
    storage.setItem(key, value);
  } catch {
    // Private browsing may restrict storage. Shortcuts still work in this tab.
    memoryOnly.add(key);
  }
  window.dispatchEvent(new Event(eventName));
}

function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}

const getSaved = () => read(savedKey);
const getRecent = () => read(recentKey);
const getServer = () => "";

export function useSavedConversions() {
  const raw = useSyncExternalStore(subscribe, getSaved, getServer);
  return useMemo(() => parseSavedRoutes(raw, allowedConversions, 48), [raw]);
}

export function toggleSavedConversion(route: string) {
  if (!allowedConversions.has(route)) return;
  const routes = parseSavedRoutes(read(savedKey), allowedConversions, 48);
  write(
    savedKey,
    routes.includes(route)
      ? routes.filter((item) => item !== route)
      : [...routes, route].slice(-48),
  );
}

export function useRecentTools() {
  const raw = useSyncExternalStore(subscribe, getRecent, getServer);
  return useMemo(() => parseSavedRoutes(raw, allowedRecent, 4), [raw]);
}

export function recordRecentTool(route: string) {
  if (!allowedRecent.has(route)) return;
  const routes = parseSavedRoutes(read(recentKey), allowedRecent, 4);
  write(
    recentKey,
    [route, ...routes.filter((item) => item !== route)].slice(0, 4),
  );
}

export function clearRecentTools() {
  write(recentKey, []);
}
