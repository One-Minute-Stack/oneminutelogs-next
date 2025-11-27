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
import { getEnvConfig } from "../configs/index.js";
/**
 * Transport for communicating with the OML server.
 *
 * Responsibilities:
 * - Buffers logs client-side and flushes by interval or batch size.
 * - Sends logs to `/send`.
 * - Retrieves logs from `/logs` with optional filters.
 * - Opens SSE stream from `/logs/stream`.
 */
export class OMLTransport {
    /**
     * Creates a new transport instance.
     *
     * @param config Logger configuration containing `apiKey`, and optionally `appName` and `environment`.
     */
    constructor(config) {
        this.config = config;
        /** In-memory buffer of logs to batch-send. */
        this.buffer = [];
        /** Scheduled timer for periodic flushes. */
        this.timer = null;
        /** Flush interval in milliseconds for buffered logs. */
        this.flushInterval = 2000;
        /** Indicates shutdown is in progress and new logs should be ignored. */
        this.shuttingDown = false;
        /** Indicates whether a flush is currently in progress. */
        this.isFlushing = false;
        const envConfig = getEnvConfig();
        this.baseUrl = envConfig.baseUrl;
        this.apiKey = config.apiKey;
        this.appName = config.appName;
        this.environment = config.environment;
        this.headers = {
            "Content-Type": "application/json",
            "x-oml-api-key": config.apiKey,
            ...(config.appName ? { "x-oml-app-name": config.appName } : {}),
            ...(config.environment ? { "x-oml-env": config.environment } : {}),
        };
        this.setupGracefulShutdown();
    }
    /** Queues a single log payload for sending. */
    async send(payload) {
        if (this.shuttingDown)
            return; // ignore new logs during shutdown
        this.buffer.push({
            ...payload,
            ingested_at: Date.now(),
        });
        // Removed immediate flush by size; rely solely on the 2s periodic flush
        if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.flushInterval);
        }
    }
    /** Flushes the in-memory buffer to the server as a single batch. */
    async flush() {
        // Prevent multiple flushes from running simultaneously.
        if (this.isFlushing)
            return;
        this.isFlushing = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        const batch = this.buffer.splice(0, this.buffer.length);
        if (batch.length === 0) {
            this.isFlushing = false;
            return;
        }
        try {
            await fetch(`${this.baseUrl}/send`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({ logs: batch }),
                keepalive: true,
            });
        }
        catch (err) {
            console.error("OMLTransport flush failed:", err);
        }
        this.isFlushing = false;
    }
    /** Registers process-level handlers (SIGINT, SIGTERM, beforeExit) */
    setupGracefulShutdown() {
        const shutdownHandler = async (signal) => {
            if (this.shuttingDown)
                return;
            this.shuttingDown = true;
            try {
                await this.flush();
            }
            catch (err) {
                console.error("[OMLTransport] Flush during shutdown failed:", err);
            }
            finally {
                process.exit(0);
            }
        };
        process.on("beforeExit", () => shutdownHandler("beforeExit"));
        process.on("SIGINT", () => shutdownHandler("SIGINT"));
        process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
    }
    /** Retrieves historical logs from the server. */
    async get(filters) {
        const headers = {
            "x-oml-api-key": this.apiKey,
            ...(this.appName ? { "x-oml-app-name": this.appName } : {}),
            ...(this.environment ? { "x-oml-env": this.environment } : {}),
        };
        const qs = filters && Object.keys(filters).length > 0
            ? `?${new URLSearchParams(filters).toString()}`
            : "";
        const res = await fetch(`${this.baseUrl}/logs${qs}`, { headers });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`OML get failed (${res.status}): ${text.slice(0, 200)}`);
        }
        return res.json();
    }
    /** Opens a Server-Sent Events (SSE) stream of live logs. */
    stream(filters) {
        const qs = new URLSearchParams(filters).toString();
        const url = `${this.baseUrl}/logs/stream?${qs}`;
        const headers = {
            "x-oml-api-key": this.apiKey,
            ...(this.appName ? { "x-oml-app-name": this.appName } : {}),
            ...(this.environment ? { "x-oml-env": this.environment } : {}),
        };
        const abortController = new AbortController();
        const readable = new ReadableStream({
            start: async (controller) => {
                const res = await fetch(url, {
                    headers,
                    signal: abortController.signal,
                });
                if (!res.body) {
                    controller.error(new Error("Upstream stream unavailable"));
                    return;
                }
                const reader = res.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done)
                            break;
                        if (value)
                            controller.enqueue(value);
                    }
                    controller.close();
                }
                catch (err) {
                    controller.error(err);
                }
            },
            cancel() {
                abortController.abort();
            },
        });
        return { body: readable };
    }
}
