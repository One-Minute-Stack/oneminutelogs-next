/**
 * oneminutelogs – getLogs hook
 *
 * Summary:
 * A small client-side React hook that fetches logs from the Next.js API route
 * (`/api/oneminutelogs/logs`) with deduping for identical filter sets. It returns
 * `data`, `isLoading`, `error`, and a `refetch()` function. Designed to work well
 * with the Next.js App Router and React 18 Strict Mode.
 *
 * Package: oneminutelogs
 * Module: utils/getLogs
 * Since: 0.1.0
 *
 * Usage:
 *   import { getLogs } from "oneminutelogs";
 *
 *   export default function Page() {
 *     const { data, isLoading, error, refetch } = getLogs({
 *       type: "error",
 *       appName: "api",
 *       search: "timeout",
 *       limit: 100,
 *     });
 *
 *     // render table from `data`…
 *   }
 *
 * Notes:
 * - The hook dedupes requests using an in-memory cache keyed by the query-string
 *   built from `filters`. It also reuses in-flight promises to avoid double fetches
 *   when components mount twice in React 18 Strict Mode.
 * - `refetch()` clears cache for the current filters and fetches fresh data.
 */
"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
// Module-level caches to dedupe dev StrictMode double-mount and reuse results
/**
 * Tracks in-flight fetch promises by query key to prevent duplicate requests.
 * @internal
 */
const inflight = new Map();
/**
 * Simple response cache keyed by the filters-derived query string.
 * @internal
 */
const cache = new Map();
/**
 * Builds a stable query-string key from filter params.
 *
 * Produces a URLSearchParams string without a leading `?`, suitable for
 * deduping/caching and request construction.
 *
 * @param params - Filter map (type, env, appName, search, limit, etc.)
 * @returns Query string without `?` (e.g. "type=error&limit=100")
 */
function buildKey(params) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
            sp.append(k, String(v));
        }
    });
    return sp.toString(); // stable key and also usable as query string
}
/**
 * React hook that fetches logs from `/api/oneminutelogs/logs`.
 *
 * - Dedupe: Uses `inflight` and `cache` keyed by filters to avoid duplicate
 *   network calls in dev and repeated requests for identical queries.
 * - Shape: Accepts both array response (`T[]`) or object `{ logs: T[] }`.
 *
 * @typeParam T - Row type returned by the server (defaults to `any`).
 * @param filters - Optional filter params, e.g. `{ type: "error", limit: 100 }`.
 * @returns Object containing `data`, `isLoading`, `error`, and `refetch`.
 */
export function getLogs(filters) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Use buildKey to create a stable key for deduping/caching
    const key = useMemo(() => buildKey(filters), [filters]);
    const fetchOnce = useCallback(async (k) => {
        // Serve cached result if present
        if (cache.has(k)) {
            return cache.get(k);
        }
        // Reuse in-flight promise for identical filters (prevents double fetch in Strict Mode)
        let p = inflight.get(k);
        if (!p) {
            const url = `/api/oneminutelogs/logs${k ? `?${k}` : ""}`;
            p = fetch(url, { cache: "no-store" }).then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Failed to fetch logs (${res.status}) ${text}`);
                }
                return res.json();
            });
            inflight.set(k, p);
        }
        try {
            const result = await p;
            cache.set(k, result);
            return result;
        }
        finally {
            inflight.delete(k);
        }
    }, []);
    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const json = await fetchOnce(key);
            const rows = Array.isArray(json) ? json : json?.logs ?? json ?? [];
            setData(rows ?? []);
        }
        catch (e) {
            if (e?.name !== "AbortError") {
                setError(e);
                setData(null);
            }
        }
        finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, fetchOnce]);
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);
    const refetch = useCallback(async () => {
        // Clear cache to force a new network call for current key
        cache.delete(key);
        await fetchLogs();
    }, [key, fetchLogs]);
    return { data, isLoading, error, refetch };
}
