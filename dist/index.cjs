"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OMLTransport: () => OMLTransport,
  createLogger: () => createLogger,
  getLogs: () => getLogs,
  getStream: () => getStream,
  handleProcessRequest: () => handleProcessRequest
});
module.exports = __toCommonJS(index_exports);

// src/configs/index.ts
var getEnvConfig = () => {
  return {
    baseUrl: "https://api.oneminutelogs.com/api/v1"
  };
};

// src/utils/index.ts
var OMLTransport = class {
  constructor(config) {
    this.config = config;
    const envConfig = getEnvConfig();
    this.baseUrl = envConfig.baseUrl;
    this.apiKey = config.apiKey;
    this.appName = config.appName;
    this.environment = config.environment;
    this.headers = {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      ...config.appName ? { "x-oml-app-name": config.appName } : {},
      ...config.environment ? { "x-oml-env": config.environment } : {}
    };
    this.setupGracefulShutdown();
  }
  config;
  baseUrl;
  apiKey;
  appName;
  environment;
  headers;
  buffer = [];
  timer = null;
  flushInterval = 2e3;
  shuttingDown = false;
  isFlushing = false;
  async send(payload) {
    if (this.shuttingDown) return;
    this.buffer.push({
      ...payload,
      ingested_at: Date.now()
    });
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  setupGracefulShutdown() {
    const shutdownHandler = async (signal) => {
      if (this.shuttingDown) return;
      this.shuttingDown = true;
      try {
        await this.flush();
      } catch (err) {
        console.error("[OMLTransport] Flush during shutdown failed:", err);
      } finally {
        process.exit(0);
      }
    };
    process.on("beforeExit", () => shutdownHandler("beforeExit"));
    process.on("SIGINT", () => shutdownHandler("SIGINT"));
    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  }
  async flush() {
    if (this.isFlushing) return;
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
      await fetch(`${this.baseUrl}/logs/send`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ logs: batch }),
        keepalive: true
      });
    } catch (error) {
      console.error("OMLTransport flush failed:", error);
    }
    this.isFlushing = false;
  }
  buildReadHeaders(options) {
    const headers = {
      ...options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : { "x-api-key": this.apiKey },
      ...this.appName ? { "x-oml-app-name": this.appName } : {},
      ...this.environment ? { "x-oml-env": this.environment } : {}
    };
    return headers;
  }
  async get(filters, options) {
    const headers = this.buildReadHeaders(options);
    const qs = filters && Object.keys(filters).length > 0 ? `?${new URLSearchParams(filters).toString()}` : "";
    const res = await fetch(`${this.baseUrl}/logs${qs}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OML get failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
  }
  async verifyWebhook({ signature, timestamp, body }) {
    const response = await fetch(`${this.baseUrl}/alerts/verify-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      body: JSON.stringify({
        signature,
        timestamp,
        body
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message ?? "Failed to verify webhook.");
    }
    return result;
  }
  stream(filters, options) {
    const qs = new URLSearchParams(filters).toString();
    const url = `${this.baseUrl}/logs/stream?${qs}`;
    const headers = this.buildReadHeaders(options);
    const abortController = new AbortController();
    const readble = new ReadableStream({
      start: async (controller) => {
        const res = await fetch(url, {
          headers,
          signal: abortController.signal
        });
        if (!res.body) {
          controller.error(new Error("Upstream stream unavailable"));
          return;
        }
        const reader = res.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
      cancel() {
        abortController.abort();
      }
    });
    return { body: readble };
  }
};

// src/core/index.ts
function createLogger(config) {
  const transport = new OMLTransport(config);
  const send = async (payload) => {
    const {
      type = "info",
      message,
      importance,
      subsystem,
      operation,
      service,
      track,
      security,
      metrics,
      timestamps,
      appName,
      environment
    } = payload;
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
      environment: environment || config.environment || process.env.NODE_ENV || "development"
    };
    await transport.send(finalPayload);
  };
  const createTypeMethod = (type) => (payload) => send({ ...payload, type });
  return {
    send,
    info: createTypeMethod("info"),
    error: createTypeMethod("error"),
    metric: createTypeMethod("metric"),
    audit: createTypeMethod("audit"),
    warning: createTypeMethod("warning"),
    get: (filters, options) => transport.get(filters, options),
    verifyWebhook: (options) => transport.verifyWebhook(options),
    stream: (filters, options) => transport.stream(filters, options)
  };
}

// src/processRequest.ts
var getRequestType = (request) => {
  const url = new URL(request.url);
  const type = url.pathname.split("/").filter(Boolean).at(-1);
  if (type === "logs" || type === "stream") {
    return type;
  }
  return null;
};
var buildHeaders = ({
  apiKey,
  appName,
  environment
}) => ({
  "x-api-key": apiKey,
  ...appName ? { "x-oml-app-name": appName } : {},
  ...environment ? { "x-oml-env": environment } : {}
});
var toErrorResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return Response.json(await response.json(), { status: response.status });
  }
  const message = await response.text();
  return Response.json(
    { error: message || "OneMinute Logs request failed" },
    { status: response.status }
  );
};
async function handleProcessRequest({
  request,
  logger,
  authToken,
  apiKey,
  appName,
  environment,
  baseUrl,
  authorize
}) {
  if (authorize) {
    const authorized = await authorize(request);
    if (!authorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!logger && !apiKey) {
    return Response.json(
      { error: "OneMinute Logs logger or API key is required" },
      { status: 500 }
    );
  }
  const type = getRequestType(request);
  if (!type) {
    return Response.json(
      { error: "Request type must be logs or stream" },
      { status: 400 }
    );
  }
  const requestUrl = new URL(request.url);
  const filters = Object.fromEntries(requestUrl.searchParams.entries());
  if (logger) {
    if (type === "stream") {
      const { body } = logger.stream(filters, { authToken: authToken || void 0 });
      return new Response(body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive"
        }
      });
    }
    return Response.json(await logger.get(filters, { authToken: authToken || void 0 }));
  }
  const query = requestUrl.searchParams.toString();
  const resolvedBaseUrl = (baseUrl || getEnvConfig().baseUrl).replace(
    /\/+$/,
    ""
  );
  const endpoint = type === "stream" ? `${resolvedBaseUrl}/logs/stream${query ? `?${query}` : ""}` : `${resolvedBaseUrl}/logs${query ? `?${query}` : ""}`;
  const response = await fetch(endpoint, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : buildHeaders({ apiKey, appName, environment }),
    cache: "no-store"
  });
  if (!response.ok) {
    return toErrorResponse(response);
  }
  if (type === "stream") {
    if (!response.body) {
      return Response.json(
        { error: "OneMinute Logs stream is unavailable" },
        { status: 502 }
      );
    }
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    });
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return Response.json(await response.json(), { status: response.status });
  }
  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": contentType || "text/plain"
    }
  });
}

// src/utils/getLogs.ts
var import_react = require("react");
var inflight = /* @__PURE__ */ new Map();
var cache = /* @__PURE__ */ new Map();
function buildKey(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== void 0 && v !== null && String(v).length > 0) {
      sp.append(k, String(v));
    }
  });
  return sp.toString();
}
function getLogs(filters) {
  const [data, setData] = (0, import_react.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  const key = (0, import_react.useMemo)(() => buildKey(filters), [filters]);
  const fetchOnce = (0, import_react.useCallback)(async (k) => {
    if (cache.has(k)) {
      return cache.get(k);
    }
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
    } finally {
      inflight.delete(k);
    }
  }, []);
  const fetchLogs = (0, import_react.useCallback)(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const json = await fetchOnce(key);
      const rows = Array.isArray(json) ? json : json.logs ?? json ?? [];
      setData(rows ?? []);
    } catch (error2) {
      if (error2?.name !== "AbortError") {
        setError(error2);
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchOnce]);
  (0, import_react.useEffect)(() => {
    fetchLogs();
  }, [fetchLogs]);
  const refetch = (0, import_react.useCallback)(async () => {
    cache.delete(key);
    await fetchLogs();
  }, []);
  return { data, isLoading, error, refetch };
}

// src/utils/getStream.ts
var import_react2 = require("react");
function toLogEntry(l) {
  const rawType = (l.type || "info").toLowerCase();
  const level = rawType === "warning" ? "warning" : rawType === "success" ? "success" : rawType === "error" ? "error" : rawType === "debug" ? "debug" : rawType === "audit" ? "audit" : rawType === "metric" ? "metric" : "info";
  let tsIso;
  if (typeof l.timestamp === "number") {
    tsIso = new Date(l.timestamp * 1e3).toISOString();
  } else {
    tsIso = (/* @__PURE__ */ new Date(String(l.timestamp).replace(" ", "T") + "Z")).toISOString();
  }
  return {
    id: crypto.randomUUID(),
    ts: tsIso,
    level,
    source: l.appName || "default",
    message: l.message,
    payload: { ...l }
  };
}
function getStream(filters) {
  const [data, setData] = (0, import_react2.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [connected, setConnected] = (0, import_react2.useState)(false);
  const esRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    const qs = filters && Object.keys(filters).length > 0 ? `?${new URLSearchParams(
      Object.entries(filters).reduce(
        (acc, [k, v]) => {
          if (v !== void 0) acc[k] = String(v);
          return acc;
        },
        {}
      )
    ).toString()}` : "";
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
          if (payload && Array.isArray(payload.logs)) {
            incoming = payload.logs.map((l) => toLogEntry(l));
          } else if (Array.isArray(payload)) {
            incoming = payload.map((l) => toLogEntry(l));
          } else if (payload && payload.keyId) {
            incoming = [toLogEntry(payload)];
          }
          if (payload?.type === "initial") {
            const next2 = incoming;
            setIsLoading(false);
            return next2.length > 5e3 ? next2.slice(next2.length - 5e3) : next2;
          }
          const next = [...prev, ...incoming];
          if (next.length > 5e3) {
            next.splice(0, next.length - 5e3);
          }
          setIsLoading(false);
          return next;
        });
      } catch (error2) {
        console.log("OML stream: failed to parse SSE message", error2);
        setError(error2);
        setIsLoading(false);
      }
    };
    es.onerror = (err) => {
      console.log("OML stream: SSE error", err);
      setError(error instanceof Error ? error : new Error("SSE error"));
    };
    return () => {
      es.close();
      setConnected(false);
    };
  }, [JSON.stringify(filters || {})]);
  const disconnect = () => {
    esRef.current?.close();
    esRef.current = null;
    setConnected(false);
  };
  return { data, isLoading, error, connected, disconnect };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OMLTransport,
  createLogger,
  getLogs,
  getStream,
  handleProcessRequest
});
