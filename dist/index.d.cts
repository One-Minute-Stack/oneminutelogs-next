type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
type AttributePrimitive = string | number | boolean | null;
type AttributeValue = AttributePrimitive | AttributePrimitive[];
type LogAttributes = Record<string, AttributeValue>;
interface LoggerConfig {
    apiKey: string;
    projectName: string;
    serviceName?: string;
    environment?: string;
    serviceVersion?: string;
    defaultAttributes?: LogAttributes;
}
interface VerifyWebhookOptions {
    signature: string;
    timestamp: string;
    body: unknown;
}
interface LogPayload {
    message: string;
    level?: LogLevel;
    eventName?: string;
    attributes?: LogAttributes;
    timestamp?: Date | string | number;
    /** Only set these when they come from a real distributed-tracing context. */
    traceId?: string;
    spanId?: string;
}
interface LogResource {
    "service.version"?: string;
    "process.runtime.name": string;
    "process.runtime.version": string;
}
interface InstrumentationScope {
    name: "@oneminutelogs/next";
    version: string;
}
/** Compact wire record emitted by this SDK. Backend-owned fields are intentionally absent. */
interface LogRecord {
    projectName: string;
    serviceName: string;
    environment: string;
    level: LogLevel;
    message: string;
    eventName?: string;
    timestamp: string;
    attributes: LogAttributes;
    resource: LogResource;
    scope: InstrumentationScope;
    traceId?: string;
    spanId?: string;
}
/** Filters accepted by the read APIs (`getLogs`, `getStream`, `logger.get`). */
interface LogQuery {
    /** Severity filter, e.g. `"error"`. */
    type?: LogLevel | (string & {});
    /** Environment name, e.g. `"production"`. */
    env?: string;
    /** Service / app name. */
    appName?: string;
    /** Substring match against the log body. */
    search?: string;
    /** Relative window, e.g. `"15m"`, `"24h"`, `"7d"` (`getLogs` only). */
    range?: string;
    /** Max rows to return. */
    limit?: number;
}
/**
 * A stored log event returned by the read APIs.
 *
 * Normalized, camelCase read model — symmetric with the record this SDK emits,
 * plus the fields OML assigns during ingestion.
 */
interface LogEvent {
    /** Stable event id assigned by OML. */
    id: string;
    /** RFC-3339 time the event occurred. */
    timestamp: string;
    /** RFC-3339 time OML observed the event. */
    observedTimestamp: string;
    /** RFC-3339 time OML durably stored the event. */
    ingestedAt: string;
    level: LogLevel;
    /** OTel normalized numeric severity (1–24). */
    severityNumber: number;
    message: string;
    eventName: string | null;
    serviceName: string;
    environment: string | null;
    /**
     * Event-scoped attributes. Values are best-effort restored to their original
     * primitive type; anything ambiguous stays a string.
     */
    attributes: LogAttributes;
    /** Resource attributes describing the telemetry source. */
    resource: LogAttributes;
    scope: {
        name: string | null;
        version: string | null;
    };
    traceId: string | null;
    spanId: string | null;
    traceFlags: number;
    /** Normalized event/pattern identity used for grouping. */
    fingerprint: string | null;
    retentionDays: number;
}
/** Response envelope from `GET /logs`. */
interface GetLogsResult {
    logs: LogEvent[];
    count: number;
    totalCount: number;
    from?: number;
    to?: number;
    cached?: boolean;
    fallback?: boolean;
}
/** A single decoded SSE frame from `GET /logs/stream`. */
interface LogStreamMessage {
    /** `"initial"` for the backfill frame, `"live"` for tailed events. */
    type: "initial" | "live";
    logs: LogEvent[];
}
/** Return value of the `getLogs` React hook. */
interface UseLogsResult {
    data: LogEvent[] | null;
    /** Account event count over the last 24h, when the server reports it. */
    total: number | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}
/** Return value of the `getStream` React hook. */
interface UseStreamResult {
    data: LogEvent[];
    isLoading: boolean;
    error: Error | null;
    connected: boolean;
    disconnect: () => void;
}

/**
 * oneminutelogs – OMLTransport
 *
 * A thin server-side transport used by the Next.js SDK to:
 * - batch and send logs to the OML server (`/logs/send`)
 * - query historical logs (`/logs`)
 * - proxy the live SSE stream (`/logs/stream`)
 *
 * Package: @oneminutelogs/next
 * Module: utils
 */

interface LogRequestOptions {
    authToken?: string;
}
declare class OMLTransport {
    private config;
    private baseUrl;
    private apiKey;
    private appName;
    private environment;
    private headers;
    private buffer;
    private timer;
    private shuttingDown;
    private isFlushing;
    private droppedLogs;
    /**
     * Returns a process-wide shared transport for the given config, keyed by
     * base URL + API key, so repeated `createLogger` calls don't leak buffers
     * or process listeners.
     */
    static getShared(config: LoggerConfig): OMLTransport;
    constructor(config: LoggerConfig);
    /** Queues a single log record for sending. */
    send(payload: LogRecord): Promise<void>;
    /** Flushes immediately and stops accepting new logs. Used by shutdown hooks. */
    flushNow(): Promise<void>;
    private scheduleFlush;
    private buildReadHeaders;
    private flush;
    /** Retrieves historical logs from the server. */
    get(filters?: LogQuery, options?: LogRequestOptions): Promise<GetLogsResult>;
    verifyWebhook({ signature, timestamp, body }: VerifyWebhookOptions): Promise<any>;
    /** Opens a Server-Sent Events (SSE) stream of live logs (raw byte stream). */
    stream(filters?: LogQuery, options?: LogRequestOptions): {
        body: ReadableStream<Uint8Array>;
    };
}

declare function createLogger(config: LoggerConfig): {
    send: (payload: LogPayload) => Promise<void>;
    trace: (payload: Omit<LogPayload, "level">) => Promise<void>;
    debug: (payload: Omit<LogPayload, "level">) => Promise<void>;
    info: (payload: Omit<LogPayload, "level">) => Promise<void>;
    warn: (payload: Omit<LogPayload, "level">) => Promise<void>;
    warning: (payload: Omit<LogPayload, "level">) => Promise<void>;
    error: (payload: Omit<LogPayload, "level">) => Promise<void>;
    fatal: (payload: Omit<LogPayload, "level">) => Promise<void>;
    verifyWebhook: (options: VerifyWebhookOptions) => Promise<any>;
    /** Query historical logs. Returns `{ logs, count, totalCount, ... }`. */
    get: (filters?: LogQuery, options?: LogRequestOptions) => Promise<GetLogsResult>;
    /** Raw SSE byte stream — consumed by `handleProcessRequest`. */
    stream: (filters?: LogQuery, options?: LogRequestOptions) => {
        body: ReadableStream<Uint8Array>;
    };
};

interface ProcessLogger {
    get: (filters?: LogQuery, options?: {
        authToken?: string;
    }) => Promise<GetLogsResult>;
    stream: (filters?: LogQuery, options?: {
        authToken?: string;
    }) => {
        body: ReadableStream<Uint8Array>;
    };
}
interface HandleProcessRequestOptions {
    request: Request;
    logger?: ProcessLogger;
    authToken?: string | null;
    apiKey?: string;
    projectName?: string;
    environment?: string;
    baseUrl?: string;
    authorize?: (request: Request) => boolean | Promise<boolean>;
}
declare function handleProcessRequest({ request, logger, authToken, apiKey, projectName, environment, baseUrl, authorize, }: HandleProcessRequestOptions): Promise<Response>;
/** Options shared by every operation served under the catch-all route. */
interface RequestHandlerOptions extends Omit<HandleProcessRequestOptions, "request" | "authorize"> {
    /** Verify the application's session and permission to access logs. */
    authorize?: NonNullable<HandleProcessRequestOptions["authorize"]>;
    /** Defaults to server-only ONE_MINUTE_LOGS_ADMIN_* environment variables. */
    admin?: {
        password?: string;
        sessionSecret?: string;
    };
    /** Server-owned browser telemetry configuration; never exposed to clients. */
    browser?: {
        apiKey: string;
        projectName: string;
        environment: string;
        routeTemplates?: readonly string[];
        endpointTemplates?: readonly string[];
    };
    /** Override only when mounting the catch-all route at a different path. */
    basePath?: string;
}
/**
 * Mount once at app/api/oneminutelogs/[...path]/route.ts.
 * Receives the original Request; only SDK-supported paths and methods are dispatched.
 * Cookies and arbitrary incoming headers are not forwarded to the OML backend.
 */
declare function forwardRequest(options: RequestHandlerOptions): (request: Request) => Promise<Response>;

/**
 * React hook that fetches historical logs from your Next.js proxy route
 * (`/api/oneminutelogs/logs`, backed by `handleProcessRequest`).
 *
 * @example
 * const { data, isLoading, error } = getLogs({ type: "error", range: "24h" });
 */
declare function getLogs(filters?: LogQuery): UseLogsResult;

/**
 * React hook that subscribes to the live-log stream via your Next.js proxy
 * route (`/api/oneminutelogs/stream`, backed by `handleProcessRequest`).
 *
 * `data` holds `LogEvent`s — a short backfill first, then the live tail
 * (capped at the most recent 5,000).
 *
 * @example
 * const { data, connected } = getStream({ type: "error" });
 */
declare function getStream(filters?: LogQuery): UseStreamResult;

export { type AttributePrimitive, type AttributeValue, type GetLogsResult, type HandleProcessRequestOptions, type InstrumentationScope, type LogAttributes, type LogEvent, type LogLevel, type LogPayload, type LogQuery, type LogRecord, type LogResource, type LogStreamMessage, type LoggerConfig, OMLTransport, type RequestHandlerOptions, type UseLogsResult, type UseStreamResult, type VerifyWebhookOptions, createLogger, forwardRequest, getLogs, getStream, handleProcessRequest };
