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
/**
 * Filters accepted by the logs API.
 *
 * Examples:
 * - { type: "error" }
 * - { appName: "api", search: "timeout" }
 * - { env: "production", limit: 200 }
 */
type Filters = Record<string, string | number | boolean | undefined>;
/**
 * Result returned by `getLogs`.
 *
 * @typeParam T - Row type in the logs array (defaults to `any`).
 */
export type GetLogsResult<T = any> = {
    /** Logs array; `null` until the first successful fetch. */
    data: T[] | null;
    /** Indicates network activity for the current filters. */
    isLoading: boolean;
    /** Error object from the last failed fetch; `null` when OK. */
    error: Error | null;
    /** Re-fetches using the current filters, bypassing cache. */
    refetch: () => Promise<void>;
};
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
export declare function getLogs<T = any>(filters?: Filters): GetLogsResult<T>;
export {};
