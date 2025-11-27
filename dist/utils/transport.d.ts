/**
 * oneminutelogs – OMLTransport
 *
 * Summary:
 * A thin transport client used by oneminutelogs SDK to:
 * - batch and send logs to the OML server (`/send`)
 * - query historical logs (`/logs`)
 * - subscribe to live logs stream via SSE (`/logs/stream`)
 *
 * Package: oneminutelogs
 * Module: utils/transport
 * Since: 0.1.0
 *
 * Usage:
 *   const oml = new OMLTransport({ apiKey, appName: "api", environment: "development" });
 *   await oml.send({ type: "info", message: "User fetched" });
 *   const { logs } = await oml.get({ type: "error", limit: 100 });
 *   const { body } = oml.stream({ type: "error", env: "production" });
 *   // pipe/read `body` as a ReadableStream of SSE bytes
 */
import type { LoggerConfig, LogPayload } from "../types/index.js";
/**
 * Transport for communicating with the OML server.
 *
 * Responsibilities:
 * - Buffers logs client-side and flushes by interval or batch size.
 * - Sends logs to `/send`.
 * - Retrieves logs from `/logs` with optional filters.
 * - Opens SSE stream from `/logs/stream`.
 */
export declare class OMLTransport {
    private config;
    /** Base server URL (depends on env config, e.g., http://localhost:4000/v1/api). */
    private baseUrl;
    /** API key used for authentication (x-oml-api-key). */
    private apiKey;
    /** Optional app name used to tag requests (x-oml-app-name). */
    private appName;
    /** Optional environment used to tag requests (x-oml-env). */
    private environment;
    /** Default headers applied to outbound requests. */
    private headers;
    /** In-memory buffer of logs to batch-send. */
    private buffer;
    /** Scheduled timer for periodic flushes. */
    private timer;
    /** Flush interval in milliseconds for buffered logs. */
    private flushInterval;
    /** Indicates shutdown is in progress and new logs should be ignored. */
    private shuttingDown;
    /** Indicates whether a flush is currently in progress. */
    private isFlushing;
    /**
     * Creates a new transport instance.
     *
     * @param config Logger configuration containing `apiKey`, and optionally `appName` and `environment`.
     */
    constructor(config: LoggerConfig);
    /** Queues a single log payload for sending. */
    send(payload: LogPayload): Promise<void>;
    /** Flushes the in-memory buffer to the server as a single batch. */
    private flush;
    /** Registers process-level handlers (SIGINT, SIGTERM, beforeExit) */
    private setupGracefulShutdown;
    /** Retrieves historical logs from the server. */
    get(filters?: Record<string, any>): Promise<any>;
    /** Opens a Server-Sent Events (SSE) stream of live logs. */
    stream(filters: Record<string, string>): {
        body: ReadableStream<Uint8Array>;
    };
}
