/**
 * oneminutelogs – getStream hook
 *
 * Summary:
 * A client-side React hook that subscribes to Server-Sent Events (SSE)
 * from `/api/oneminutelogs/stream`, normalizes incoming log payloads,
 * and returns live data with connection state and a disconnect control.
 *
 * Package: oneminutelogs
 * Module: utils/getStream
 * Since: 0.1.0
 *
 * Usage:
 *   import { getStream } from "oneminutelogs";
 *
 *   export default function Page() {
 *     const { data, isLoading, error, connected, disconnect } = getStream({
 *       type: "error",
 *       appName: "api",
 *       env: "development",
 *       limit: 200,
 *     });
 *     // render live rows from `data`…
 *   }
 *
 * Notes:
 * - The hook handles initial batches and incremental messages, keeping up to
 *   5000 entries in memory to avoid unbounded growth.
 * - Accepts filters (type, env, appName, search, limit) which are passed through
 *   to the Next.js route and ultimately to the OML server.
 */
"use client";
import { useEffect, useRef, useState } from "react";
/**
 * Converts a raw stream payload into a normalized UI-friendly entry.
 *
 * @param l Raw stream log (ClickHouse row shape).
 * @returns StreamLogNormalized entry.
 */
function toLogEntry(l) {
    const rawType = (l.type || "info").toLowerCase();
    const level = rawType === "warning"
        ? "warning"
        : rawType === "success"
            ? "success"
            : rawType === "error"
                ? "error"
                : rawType === "debug"
                    ? "debug"
                    : rawType === "audit"
                        ? "audit"
                        : rawType === "metric"
                            ? "metric"
                            : "info";
    let tsIso;
    if (typeof l.timestamp === "number") {
        tsIso = new Date(l.timestamp * 1000).toISOString();
    }
    else {
        // Handle "YYYY-MM-DD HH:mm:ss" from ClickHouse JSONEachRow
        tsIso = new Date(String(l.timestamp).replace(" ", "T") + "Z").toISOString();
    }
    return {
        id: crypto.randomUUID(),
        ts: tsIso,
        level,
        source: l.appName || "default",
        message: l.message,
        payload: { ...l },
    };
}
/**
 * React hook subscribing to the OML SSE stream.
 *
 * - Opens EventSource to `/api/oneminutelogs/stream` with optional filters.
 * - Handles initial batch messages `{ type: "initial", logs: [...] }` and
 *   subsequent incremental messages (array, single object, or `{ logs }`).
 * - Maintains a rolling buffer capped at 5000 entries.
 * - Cleans up the EventSource on unmount or when filters change.
 *
 * @param filters Optional stream filters (type, env, appName, search, limit).
 * @returns Live stream data and connection state with `disconnect()` control.
 */
export function getStream(filters) {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    const esRef = useRef(null);
    useEffect(() => {
        const qs = filters && Object.keys(filters).length > 0
            ? `?${new URLSearchParams(Object.entries(filters).reduce((acc, [k, v]) => {
                if (v !== undefined)
                    acc[k] = String(v);
                return acc;
            }, {})).toString()}`
            : "";
        const es = new EventSource(`/api/oneminutelogs/stream${qs}`);
        esRef.current = es;
        setConnected(true);
        setIsLoading(true);
        setError(null);
        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                setData((prev) => {
                    let incoming = [];
                    // Handle different shapes: { type, logs }, array, or single
                    if (payload && Array.isArray(payload.logs)) {
                        incoming = payload.logs.map((l) => toLogEntry(l));
                    }
                    else if (Array.isArray(payload)) {
                        incoming = payload.map((l) => toLogEntry(l));
                    }
                    else if (payload && payload.keyId) {
                        incoming = [toLogEntry(payload)];
                    }
                    if (payload?.type === "initial") {
                        const next = incoming;
                        setIsLoading(false);
                        return next.length > 5000
                            ? next.slice(next.length - 5000)
                            : next;
                    }
                    const next = [...prev, ...incoming];
                    if (next.length > 5000) {
                        next.splice(0, next.length - 5000);
                    }
                    setIsLoading(false);
                    return next;
                });
            }
            catch (err) {
                console.error("OML stream: failed to parse SSE message", err);
                setError(err);
                setIsLoading(false);
            }
        };
        es.onerror = (err) => {
            console.error("OML stream: SSE error", err);
            setError(err instanceof Error ? err : new Error("SSE error"));
        };
        return () => {
            es.close();
            setConnected(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters || {})]);
    const disconnect = () => {
        esRef.current?.close();
        esRef.current = null;
        setConnected(false);
    };
    return { data, isLoading, error, connected, disconnect };
}
