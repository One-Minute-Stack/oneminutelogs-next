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
/**
 * Filters accepted by the SSE stream API.
 *
 * Examples:
 * - { type: "error" }
 * - { appName: "api", search: "timeout" }
 * - { env: "production", limit: 200 }
 */
type Filters = Record<string, string | number | boolean | undefined>;
/**
 * Log severity level used by the normalized stream entries.
 */
type LogLevel = "info" | "warning" | "error" | "debug" | "success" | "audit" | "metric";
/**
 * Normalized log entry shape for UI components.
 *
 * - `id`: locally generated UUID for stable list rendering
 * - `ts`: ISO timestamp string
 * - `level`: normalized severity level
 * - `source`: app/service name (e.g., "api")
 * - `message`: log message
 * - `payload`: full raw log payload for detail views
 */
export type StreamLogNormalized = {
    id: string;
    ts: string;
    level: LogLevel;
    source: string;
    message: string;
    payload: Record<string, unknown>;
};
/**
 * Hook return type for the SSE stream.
 *
 * - `data`: normalized stream entries
 * - `isLoading`: true while the initial batch is loading
 * - `error`: last encountered error
 * - `connected`: true if EventSource is open
 * - `disconnect`: manual termination of the stream connection
 */
export type GetStreamResult = {
    data: StreamLogNormalized[];
    isLoading: boolean;
    error: Error | null;
    connected: boolean;
    disconnect: () => void;
};
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
export declare function getStream(filters?: Filters): GetStreamResult;
export {};
