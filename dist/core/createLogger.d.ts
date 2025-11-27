/**
 * oneminutelogs – createLogger
 *
 * Summary:
 * Factory that creates a typed logger backed by OMLTransport. Provides:
 * - `send` for generic logging
 * - type helpers: `info`, `error`, `metric`, `audit`, `warning`
 * - passthrough `get` and `stream` to query historical logs and subscribe to live logs
 *
 * Package: oneminutelogs
 * Module: core/createLogger
 * Since: 0.1.0
 *
 * Usage:
 *   const logger = createLogger({ apiKey, appName: "api", environment: "development" });
 *   await logger.info({ message: "Hello, world" });
 *   const allErrors = await logger.get({ type: "error", limit: 100 });
 *   const live = logger.stream({ type: "error" });
 */
import type { LoggerConfig, LogPayload } from "../types/index.js";
/**
 * Creates a logger bound to an OML transport.
 *
 * Behavior:
 * - Enriches payloads with `appName` and `environment` from config when not provided.
 * - Defaults `type` to "info" when `send` is called without an explicit type.
 *
 * @param config Configuration with `apiKey` and optional `appName`, `environment`.
 * @returns Logger API with `send`, type helpers, `get`, and `stream`.
 */
export declare function createLogger(config: LoggerConfig): {
    send: (payload: LogPayload) => Promise<void>;
    info: (payload: Omit<LogPayload, "type">) => Promise<void>;
    error: (payload: Omit<LogPayload, "type">) => Promise<void>;
    metric: (payload: Omit<LogPayload, "type">) => Promise<void>;
    audit: (payload: Omit<LogPayload, "type">) => Promise<void>;
    warning: (payload: Omit<LogPayload, "type">) => Promise<void>;
    get: (filters?: Record<string, any>) => Promise<any>;
    stream: (filters?: Record<string, any>) => {
        body: ReadableStream<Uint8Array>;
    };
};
