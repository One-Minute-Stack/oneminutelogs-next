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
import { OMLTransport } from "../utils/transport.js";
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
export function createLogger(config) {
    const transport = new OMLTransport(config);
    /**
     * Sends a log payload.
     *
     * Merges defaults:
     * - `type`: defaults to "info"
     * - `appName`: `payload.appName || config.appName || "default"`
     * - `environment`: `payload.environment || config.environment || process.env.NODE_ENV || "development"`
     *
     * @param payload Log payload to send.
     * @returns Promise that resolves when the payload is enqueued/flushed.
     */
    const send = async (payload) => {
        const { type = "info", message, importance, subsystem, operation, service, track, security, metrics, timestamps, appName, environment, } = payload;
        const finalPayload = {
            type,
            message,
            importance,
            subsystem,
            operation,
            service,
            track,
            security,
            metrics,
            timestamps,
            appName: appName || config.appName || "default",
            environment: environment ||
                config.environment ||
                process.env.NODE_ENV ||
                "development",
        };
        await transport.send(finalPayload);
    };
    // Helper factory to create type-specific methods dynamically
    /**
     * Factory for type-specific logging methods (e.g., `info`, `error`).
     *
     * @param type Log type to set on the outgoing payload.
     * @returns Function that accepts a payload without `type` and sends it with the provided `type`.
     */
    const createTypeMethod = (type) => (payload) => send({ ...payload, type });
    /**
     * Returned API:
     * - `send(payload)`: send a generic log (defaults `type` to "info").
     * - `info(payload)`, `error(payload)`, `metric(payload)`, `audit(payload)`, `warning(payload)`: type-specific helpers.
     * - `get(filters?)`: fetch historical logs via transport.
     * - `stream(filters?)`: open SSE stream via transport.
     */
    return {
        send,
        info: createTypeMethod("info"),
        error: createTypeMethod("error"),
        metric: createTypeMethod("metric"),
        audit: createTypeMethod("audit"),
        warning: createTypeMethod("warning"),
        get: (filters) => transport.get(filters),
        stream: (filters) => transport.stream(filters),
    };
}
