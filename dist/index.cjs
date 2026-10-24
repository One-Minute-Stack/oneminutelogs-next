"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// src/configs/index.ts
var SDK_NAME, SDK_VERSION, DEFAULT_BASE_URL, getEnvConfig;
var init_configs = __esm({
  "src/configs/index.ts"() {
    "use strict";
    SDK_NAME = "@oneminutelogs/next";
    SDK_VERSION = "1.2.0";
    DEFAULT_BASE_URL = "https://api.oneminutelogs.com/api/v2";
    getEnvConfig = () => {
      const baseUrl = DEFAULT_BASE_URL;
      return {
        baseUrl: baseUrl.replace(/\/+$/, "")
      };
    };
  }
});

// src/request-origin.ts
function requestOrigin(request) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (host) {
    const authority = new URL(`${url.protocol}//${host}`);
    if (authority.host !== host.toLowerCase() || authority.username || authority.password) throw new Error("Invalid request authority");
    url.host = authority.host;
  }
  return url.origin;
}
function isSameOrigin(request) {
  try {
    return request.headers.get("origin") === requestOrigin(request) && request.headers.get("sec-fetch-site") !== "cross-site";
  } catch {
    return false;
  }
}
var init_request_origin = __esm({
  "src/request-origin.ts"() {
    "use strict";
  }
});

// src/admin-auth.ts
var admin_auth_exports = {};
__export(admin_auth_exports, {
  adminConfig: () => adminConfig,
  handleAdmin: () => handleAdmin,
  isAdmin: () => isAdmin
});
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
async function equal(a, b) {
  const key = await hmacKey("oml-constant-time-comparison");
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(a));
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(b));
}
function adminConfig(options) {
  return {
    password: options?.password ?? process.env.ONE_MINUTE_LOGS_ADMIN_PASSWORD,
    sessionSecret: options?.sessionSecret ?? process.env.ONE_MINUTE_LOGS_ADMIN_SESSION_SECRET
  };
}
function cookieName(request) {
  return new URL(request.url).protocol === "https:" ? "__Secure-oml_admin" : "oml_admin";
}
function tokenFrom(request) {
  const name = cookieName(request);
  return request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(name + "="))?.slice(name.length + 1) ?? "";
}
function cookie(request, basePath, token, maxAge) {
  return `${cookieName(request)}=${token}; Path=${basePath}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
async function verifiedToken(request, config, basePath) {
  if (!valid(config)) return false;
  const token = tokenFrom(request);
  if (token.length > 1024) return false;
  const [expiry, nonce, fingerprint, signature, extra] = token.split(".");
  const now = Date.now();
  for (const [entry, until] of revoked) if (until <= now) revoked.delete(entry);
  if (extra !== void 0 || !expiry || !nonce || !fingerprint || !signature || !/^\d+$/.test(expiry) || Number(expiry) * 1e3 <= now || Number(expiry) * 1e3 > now + TTL * 1e3 || revoked.has(token))
    return false;
  return await equal(
    fingerprint,
    await sign(config.password, config.sessionSecret)
  ) && await equal(
    signature,
    await sign(
      `${basePath}:${expiry}.${nonce}.${fingerprint}`,
      config.sessionSecret
    )
  );
}
async function isAdmin(request, options, basePath) {
  return verifiedToken(request, adminConfig(options), basePath);
}
async function handleAdmin(request, operation, options, basePath) {
  const config = adminConfig(options);
  const response = (status, body2, headers8 = {}) => Response.json(body2, {
    status,
    headers: { "Cache-Control": "no-store", ...headers8 }
  });
  if (!valid(config))
    return response(503, {
      error: "Admin password (minimum 6 characters) and session secret (minimum 32 characters) must be configured"
    });
  const method = operation === "admin/session" ? "GET" : "POST";
  if (request.method !== method)
    return response(405, { error: "Method not allowed" }, { Allow: method });
  if (method === "GET") {
    const authenticated = await isAdmin(request, options, basePath);
    return response(authenticated ? 200 : 401, { authenticated });
  }
  if (!isSameOrigin(request))
    return response(403, { error: "Same-origin request required" });
  if (operation === "admin/logout") {
    const token2 = tokenFrom(request);
    if (await isAdmin(request, options, basePath)) {
      if (revoked.size >= 1e4)
        return response(503, { error: "Session revocation capacity reached" });
      revoked.set(token2, Number(token2.split(".")[0]) * 1e3);
    }
    return response(
      200,
      { authenticated: false },
      { "Set-Cookie": cookie(request, basePath, "", 0) }
    );
  }
  const scope = await sign(basePath, config.sessionSecret);
  const now = Date.now();
  const recent = attempts.get(scope);
  if (recent && recent.until > now && recent.count >= 10)
    return response(
      429,
      { error: "Too many attempts; try again later" },
      { "Retry-After": String(Math.ceil((recent.until - now) / 1e3)) }
    );
  if (attempts.size >= 1e3) {
    for (const [key, item] of attempts)
      if (item.until <= now) attempts.delete(key);
  }
  if (!recent && attempts.size >= 1e3)
    return response(503, { error: "Login capacity reached" });
  attempts.set(scope, {
    count: recent && recent.until > now ? recent.count + 1 : 1,
    until: recent && recent.until > now ? recent.until : now + 6e4
  });
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return response(415, { error: "JSON required" });
  let body = "";
  const reader = request.body?.getReader();
  if (!reader) return response(400, { error: "Password required" });
  let size = 0;
  const decoder = new TextDecoder();
  try {
    for (; ; ) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return response(413, { error: "Request too large" });
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    const password = JSON.parse(body)?.password;
    if (typeof password !== "string" || !await equal(password, config.password))
      return response(401, { error: "Invalid password" });
  } catch {
    return response(400, { error: "Invalid request" });
  }
  const expiry = Math.floor(now / 1e3) + TTL;
  const payload = `${expiry}.${Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url")}.${await sign(config.password, config.sessionSecret)}`;
  const token = `${payload}.${await sign(`${basePath}:${payload}`, config.sessionSecret)}`;
  return response(
    200,
    { authenticated: true },
    { "Set-Cookie": cookie(request, basePath, token, TTL) }
  );
}
var TTL, attempts, revoked, encoder, valid, sign;
var init_admin_auth = __esm({
  "src/admin-auth.ts"() {
    "use strict";
    init_request_origin();
    TTL = 8 * 60 * 60;
    attempts = /* @__PURE__ */ new Map();
    revoked = /* @__PURE__ */ new Map();
    encoder = new TextEncoder();
    valid = (config) => typeof config.password === "string" && [...config.password].length >= 6 && typeof config.sessionSecret === "string" && config.sessionSecret.length >= 32;
    sign = async (value, secret) => Buffer.from(
      await crypto.subtle.sign(
        "HMAC",
        await hmacKey(secret),
        encoder.encode(value)
      )
    ).toString("base64url");
  }
});

// src/dashboard-server/config.ts
function credentialHeaders(config) {
  return config.authToken ? { Authorization: `Bearer ${config.authToken}` } : { "x-api-key": config.apiKey };
}
async function hashScope(value) {
  return Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  ).toString("hex");
}
var init_config = __esm({
  "src/dashboard-server/config.ts"() {
    "use strict";
  }
});

// src/dashboard-server/billing-checkout.ts
async function POST(config, request, portal = false) {
  if (!config.authToken && !config.apiKey) return failure(503, "Billing is not configured");
  let plan;
  if (!portal) {
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return failure(415, "JSON required");
    const reader = request.body?.getReader();
    if (!reader) return failure(400, "Choose a paid plan");
    let bytes = 0, text = "";
    const decoder = new TextDecoder();
    const deadline = Date.now() + 1e4;
    try {
      for (; ; ) {
        let timer;
        const chunk = await Promise.race([reader.read(), new Promise((_, reject) => {
          timer = setTimeout(() => reject(Error("timeout")), Math.max(0, deadline - Date.now()));
        })]).finally(() => clearTimeout(timer));
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 1024) {
          await reader.cancel();
          return failure(413, "Request too large");
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      plan = JSON.parse(text + decoder.decode())?.plan;
    } catch {
      void reader.cancel().catch(() => {
      });
      return failure(400, "Invalid billing request");
    }
    if (!["starter", "pro", "business"].includes(plan ?? "")) return failure(400, "Choose Starter, Pro, or Business");
  }
  let endpoint;
  try {
    endpoint = new URL(config.baseUrl || getEnvConfig().baseUrl);
    if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !["https:", "http:"].includes(endpoint.protocol) || endpoint.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname))) throw Error();
    endpoint.pathname = endpoint.pathname.replace(/\/+$/, "") + (portal ? "/billing/portal" : "/billing");
  } catch {
    return failure(503, "Billing is not configured");
  }
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { ...credentialHeaders(config), "Content-Type": "application/json", Accept: "application/json" },
      body: portal ? void 0 : JSON.stringify({ plan }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(2e4)
    });
    if (!upstream.ok) return failure(upstream.status, "Unable to open Stripe billing. Please try again.");
    const data = await upstream.json();
    const target = new URL(data.url);
    if (target.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(target.hostname) || target.username || target.password || target.port) return failure(502, "Invalid Stripe redirect");
    return Response.json({ url: target.href }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(502, "Unable to open Stripe billing. Please try again.");
  }
}
var failure;
var init_billing_checkout = __esm({
  "src/dashboard-server/billing-checkout.ts"() {
    "use strict";
    init_config();
    init_configs();
    failure = (status, error) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
  }
});

// src/dashboard-server/alerts-custom-rules.ts
async function bridge(omlConfig, request) {
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure2(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/alerts/custom-rules`;
    endpoint = base;
  } catch {
    return failure2(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([endpoint.href, apiKey, omlConfig.projectName]));
  const deleting = request?.method === "DELETE";
  if (deleting) {
    const ruleId = new URL(request.url).searchParams.get("ruleId") || "";
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      ruleId
    ))
      return failure2(400, "Invalid custom rule ID");
    endpoint.pathname += `/${ruleId}`;
  }
  const generation = revision;
  const writing = request?.method === "POST" || deleting;
  let body;
  if (request?.method === "POST") {
    try {
      body = await request.json();
      const input = body;
      if (input?.version !== 2 || !Array.isArray(input.conditions) || input.conditions.length < 1 || input.conditions.length > 5)
        return failure2(400, "Between 1 and 5 conditions are required");
    } catch {
      return failure2(400, "Invalid rule payload");
    }
  }
  const cached = cache.get(key);
  if (!writing && !omlConfig.authToken && cached && cached.expiresAt > Date.now())
    return Response.json(cached.overview, { headers });
  if (!writing) cache.delete(key);
  if (writing) return loadRules(apiKey);
  if (omlConfig.authToken) return loadRules(apiKey);
  let pending = requests.get(key);
  if (!pending) {
    const task = loadRules(apiKey).finally(() => {
      if (requests.get(key) === task) requests.delete(key);
    });
    pending = task;
    requests.set(key, pending);
  }
  return (await pending).clone();
  async function loadRules(apiKey2) {
    try {
      const response = await fetch(endpoint, {
        method: deleting ? "DELETE" : writing ? "POST" : "GET",
        body: request?.method === "POST" ? JSON.stringify(body) : void 0,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...credentialHeaders(omlConfig),
          "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        return failure2(
          response.status,
          writing && typeof data?.message === "string" ? data.message : "Unable to load custom rules"
        );
      }
      const overview = await response.json();
      if (!overview || typeof overview !== "object" || !writing && !Array.isArray(overview))
        return failure2(502, "Invalid custom rules response");
      if (writing) {
        revision++;
        cache.delete(key);
        requests.delete(key);
        return Response.json(overview, {
          status: deleting ? 200 : 201,
          headers
        });
      }
      if (cache.size >= MAX_CACHE_ENTRIES)
        cache.delete(cache.keys().next().value);
      if (generation === revision) {
        if (!omlConfig.authToken) cache.set(key, { overview, expiresAt: Date.now() + CACHE_TTL_MS });
      }
      return Response.json(overview, { headers });
    } catch (error) {
      return error instanceof Error && error.name === "TimeoutError" ? failure2(504, "custom rules request timed out") : failure2(502, "Unable to reach the dashboard service");
    }
  }
}
function GET(omlConfig) {
  return bridge(omlConfig);
}
function POST2(omlConfig, request) {
  return bridge(omlConfig, request);
}
function DELETE(omlConfig, request) {
  return bridge(omlConfig, request);
}
var CACHE_TTL_MS, MAX_CACHE_ENTRIES, cache, revision, requests, headers, failure2;
var init_alerts_custom_rules = __esm({
  "src/dashboard-server/alerts-custom-rules.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS = 3e4;
    MAX_CACHE_ENTRIES = 16;
    cache = /* @__PURE__ */ new Map();
    revision = 0;
    requests = /* @__PURE__ */ new Map();
    headers = { "Cache-Control": "no-store" };
    failure2 = (status, error) => Response.json({ error }, { status, headers });
  }
});

// src/dashboard-server/dashboard-realtime-logs.ts
async function GET2(omlConfig, request) {
  const query = new URL(request.url).searchParams;
  const ranges = query.getAll("range");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "7d")
    return fail(400, "range must be 7d");
  const cursors = query.getAll("cursor");
  if (cursors.length > 1 || cursors.length === 1 && (cursors[0].length > 600 || !/^[A-Za-z0-9_-]+$/.test(cursors[0])))
    return fail(400, "Invalid cursor");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return fail(503, "Dashboard connection is not configured");
  let url;
  try {
    url = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw Error();
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/dashboard/realtime-logs`;
    url.search = new URLSearchParams({
      range: "7d"
    }).toString();
    if (cursors.length) url.searchParams.set("cursor", cursors[0]);
  } catch {
    return fail(503, "Dashboard connection is not configured");
  }
  const abort = new AbortController();
  const disconnect = () => abort.abort();
  request.signal.addEventListener("abort", disconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(
    () => abort.abort(new DOMException("Connection timed out", "TimeoutError")),
    15e3
  );
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", disconnect);
  };
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: abort.signal
    });
    if (!upstream.ok)
      return fail(upstream.status, "Unable to load older realtime logs");
    const page = await upstream.json();
    if (!page || typeof page !== "object" || !("logs" in page) || !Array.isArray(page.logs))
      return fail(502, "Invalid endpoint history response");
    return Response.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail(502, "Unable to load older realtime logs");
  } finally {
    cleanup();
  }
}
var fail;
var init_dashboard_realtime_logs = __esm({
  "src/dashboard-server/dashboard-realtime-logs.ts"() {
    "use strict";
    init_config();
    fail = (status, error) => Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
});

// src/dashboard-server/dashboard-browser-health.ts
async function GET3(omlConfig, request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const ranges = incoming.getAll("range");
  if (ranges.length > 1 || ranges.length === 1 && !["7d", "24h", "1h"].includes(ranges[0]))
    return failure3(400, "Invalid range");
  query.set("range", ranges[0] || "7d");
  const offsets = incoming.getAll("networkOffset");
  if (offsets.length > 1 || offsets.length === 1 && !/^\d{1,7}$/.test(offsets[0]) || Number(offsets[0] || 0) > 1e6)
    return failure3(400, "Invalid network offset");
  query.set("networkOffset", offsets[0] || "0");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure3(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/dashboard/browser-health`;
    base.search = query.toString();
    endpoint = base;
  } catch {
    return failure3(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([endpoint.href, apiKey, omlConfig.projectName]));
  const cached = cache2.get(key);
  if (!omlConfig.authToken && cached && cached.expiresAt > Date.now())
    return Response.json(cached.overview, { headers: headers2 });
  cache2.delete(key);
  if (omlConfig.authToken) return loadOverview(apiKey);
  let pending = requests2.get(key);
  if (!pending) {
    pending = loadBrowserHealth(apiKey).finally(() => requests2.delete(key));
    requests2.set(key, pending);
  }
  return (await pending).clone();
  async function loadBrowserHealth(apiKey2) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...credentialHeaders(omlConfig),
          "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        return failure3(response.status, "Unable to load browser health");
      }
      const overview = await response.json();
      if (!overview || typeof overview !== "object" || Array.isArray(overview))
        return failure3(502, "Invalid browser health response");
      if (cache2.size >= MAX_CACHE_ENTRIES2)
        cache2.delete(cache2.keys().next().value);
      if (!omlConfig.authToken) cache2.set(key, { overview, expiresAt: Date.now() + CACHE_TTL_MS2 });
      return Response.json(overview, { headers: headers2 });
    } catch (error) {
      return error instanceof Error && error.name === "TimeoutError" ? failure3(504, "browser health request timed out") : failure3(502, "Unable to reach the dashboard service");
    }
  }
}
var CACHE_TTL_MS2, MAX_CACHE_ENTRIES2, cache2, requests2, headers2, failure3;
var init_dashboard_browser_health = __esm({
  "src/dashboard-server/dashboard-browser-health.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS2 = 3e4;
    MAX_CACHE_ENTRIES2 = 16;
    cache2 = /* @__PURE__ */ new Map();
    requests2 = /* @__PURE__ */ new Map();
    headers2 = { "Cache-Control": "no-store" };
    failure3 = (status, error) => Response.json({ error }, { status, headers: headers2 });
  }
});

// src/dashboard-server/dashboard-recent-logs.ts
async function GET4(omlConfig, request) {
  const query = new URL(request.url).searchParams;
  const limits = query.getAll("limit"), ranges = query.getAll("range");
  const limit = limits[0] ?? "10";
  if (limits.length > 1 || !/^\d{1,2}$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)
    return failure4(400, "limit must be between 1 and 50");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "24h")
    return failure4(400, "range must be 24h");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure4(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/dashboard/recent-logs`;
    base.searchParams.set("range", "24h");
    base.searchParams.set("limit", limit);
    endpoint = base;
  } catch {
    return failure4(503, "Dashboard connection is not configured");
  }
  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok)
      return failure4(response.status, "Unable to load recent logs");
    const data = await response.json();
    if (!data || typeof data !== "object" || !("logs" in data) || !Array.isArray(data.logs))
      return failure4(502, "Invalid recent logs response");
    return Response.json(data, { headers: headers3 });
  } catch (error) {
    return error instanceof Error && error.name === "TimeoutError" ? failure4(504, "Recent logs request timed out") : failure4(502, "Unable to reach the dashboard service");
  }
}
var headers3, failure4;
var init_dashboard_recent_logs = __esm({
  "src/dashboard-server/dashboard-recent-logs.ts"() {
    "use strict";
    init_config();
    headers3 = { "Cache-Control": "no-store" };
    failure4 = (status, error) => Response.json({ error }, { status, headers: headers3 });
  }
});

// src/dashboard-server/dashboard-overview.ts
async function GET5(omlConfig, request) {
  const ranges = new URL(request.url).searchParams.getAll("range");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "24h")
    return failure5(400, "range must be 24h");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure5(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/dashboard/overview`;
    base.searchParams.set("range", "24h");
    endpoint = base;
  } catch {
    return failure5(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([endpoint.href, apiKey, omlConfig.projectName]));
  const cached = cache3.get(key);
  if (!omlConfig.authToken && cached && cached.expiresAt > Date.now())
    return Response.json(cached.overview, { headers: headers4 });
  cache3.delete(key);
  if (omlConfig.authToken) return loadOverview2(apiKey);
  let pending = requests3.get(key);
  if (!pending) {
    pending = loadOverview2(apiKey).finally(() => requests3.delete(key));
    requests3.set(key, pending);
  }
  return (await pending).clone();
  async function loadOverview2(apiKey2) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...credentialHeaders(omlConfig),
          "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        return failure5(response.status, "Unable to load dashboard overview");
      }
      const overview = await response.json();
      if (!overview || typeof overview !== "object" || Array.isArray(overview))
        return failure5(502, "Invalid dashboard response");
      if (cache3.size >= MAX_CACHE_ENTRIES3)
        cache3.delete(cache3.keys().next().value);
      if (!omlConfig.authToken) cache3.set(key, { overview, expiresAt: Date.now() + CACHE_TTL_MS3 });
      return Response.json(overview, { headers: headers4 });
    } catch (error) {
      return error instanceof Error && error.name === "TimeoutError" ? failure5(504, "Dashboard request timed out") : failure5(502, "Unable to reach the dashboard service");
    }
  }
}
var CACHE_TTL_MS3, MAX_CACHE_ENTRIES3, cache3, requests3, headers4, failure5;
var init_dashboard_overview = __esm({
  "src/dashboard-server/dashboard-overview.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS3 = 3e4;
    MAX_CACHE_ENTRIES3 = 16;
    cache3 = /* @__PURE__ */ new Map();
    requests3 = /* @__PURE__ */ new Map();
    headers4 = { "Cache-Control": "no-store" };
    failure5 = (status, error) => Response.json({ error }, { status, headers: headers4 });
  }
});

// src/dashboard-server/dashboard-api-performance.ts
async function GET6(omlConfig, request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const name of ["range", "limit", "offset", "search", "method", "sort"]) {
    const values = incoming.getAll(name);
    if (values.length > 1) return failure6(400, `Invalid ${name}`);
    if (values.length) query.set(name, values[0]);
  }
  if (query.has("range") && query.get("range") !== "7d")
    return failure6(400, "range must be 7d");
  for (const [name, min, max] of [
    ["limit", 1, 500],
    ["offset", 0, 1e6]
  ]) {
    const value = query.get(name);
    if (value !== null && (!/^\d{1,7}$/.test(value) || Number(value) < min || Number(value) > max))
      return failure6(400, `Invalid ${name}`);
  }
  if ((query.get("search")?.length ?? 0) > 200 || /[\u0000-\u001f\u007f]/.test(query.get("search") || ""))
    return failure6(400, "Invalid search");
  if (query.get("method") && !/^[A-Z]{1,16}$/.test(query.get("method")))
    return failure6(400, "Invalid method");
  if (query.has("sort") && !["requests", "latency", "errors", "failures"].includes(query.get("sort")))
    return failure6(400, "Invalid sort");
  query.set("range", "7d");
  query.set("limit", query.get("limit") || "25");
  query.set("offset", query.get("offset") || "0");
  query.set("sort", query.get("sort") || "requests");
  query.sort();
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure6(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/dashboard/api-performance`;
    base.search = query.toString();
    endpoint = base;
  } catch {
    return failure6(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([endpoint.href, apiKey, omlConfig.projectName]));
  const cached = cache4.get(key);
  if (!omlConfig.authToken && cached && cached.expiresAt > Date.now())
    return Response.json(cached.overview, { headers: headers5 });
  cache4.delete(key);
  if (omlConfig.authToken) return loadOverview(apiKey);
  let pending = requests4.get(key);
  if (!pending) {
    pending = loadPerformance(apiKey).finally(() => requests4.delete(key));
    requests4.set(key, pending);
  }
  return (await pending).clone();
  async function loadPerformance(apiKey2) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...credentialHeaders(omlConfig),
          "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        return failure6(response.status, "Unable to load API performance");
      }
      const overview = await response.json();
      if (!overview || typeof overview !== "object" || Array.isArray(overview))
        return failure6(502, "Invalid API performance response");
      if (cache4.size >= MAX_CACHE_ENTRIES4)
        cache4.delete(cache4.keys().next().value);
      if (!omlConfig.authToken) cache4.set(key, { overview, expiresAt: Date.now() + CACHE_TTL_MS4 });
      return Response.json(overview, { headers: headers5 });
    } catch (error) {
      return error instanceof Error && error.name === "TimeoutError" ? failure6(504, "API performance request timed out") : failure6(502, "Unable to reach the dashboard service");
    }
  }
}
var CACHE_TTL_MS4, MAX_CACHE_ENTRIES4, cache4, requests4, headers5, failure6;
var init_dashboard_api_performance = __esm({
  "src/dashboard-server/dashboard-api-performance.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS4 = 3e4;
    MAX_CACHE_ENTRIES4 = 16;
    cache4 = /* @__PURE__ */ new Map();
    requests4 = /* @__PURE__ */ new Map();
    headers5 = { "Cache-Control": "no-store" };
    failure6 = (status, error) => Response.json({ error }, { status, headers: headers5 });
  }
});

// src/dashboard-server/dashboard-incidents.ts
async function GET7(omlConfig, request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const name of ["conditionKey", "state", "source", "cursor", "limit"]) {
    const values = incoming.getAll(name);
    if (values.length > 1) return failure7(400, `Invalid ${name}`);
    if (values.length) query.set(name, values[0]);
  }
  const conditionKey = query.get("conditionKey");
  if (conditionKey !== null && !/^[a-f0-9]{64}$/.test(conditionKey))
    return failure7(400, "Invalid condition key");
  if (query.has("state") && !["active", "suspected", "recovering", "resolved"].includes(
    query.get("state")
  ))
    return failure7(400, "Invalid state");
  if (query.has("source") && !["backend_logs", "rum_network", "rum_javascript"].includes(
    query.get("source")
  ))
    return failure7(400, "Invalid source");
  if (query.has("cursor") && (!/^[A-Za-z0-9_-]+$/.test(query.get("cursor")) || query.get("cursor").length > 256))
    return failure7(400, "Invalid cursor");
  if (query.has("limit") && (!/^\d{1,2}$/.test(query.get("limit")) || Number(query.get("limit")) < 1 || Number(query.get("limit")) > 50))
    return failure7(400, "Invalid limit");
  query.delete("conditionKey");
  if (conditionKey) query.forEach((_, key2) => query.delete(key2));
  else query.set("limit", query.get("limit") || "25");
  query.sort();
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure7(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/dashboard/incidents${conditionKey ? `/${conditionKey}` : ""}`;
    base.search = query.toString();
    endpoint = base;
  } catch {
    return failure7(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([endpoint.href, apiKey, omlConfig.projectName]));
  const cached = cache5.get(key);
  if (!omlConfig.authToken && cached && cached.expiresAt > Date.now())
    return Response.json(cached.overview, { headers: headers6 });
  cache5.delete(key);
  if (omlConfig.authToken) return loadOverview(apiKey);
  let pending = requests5.get(key);
  if (!pending) {
    pending = loadIncidents(apiKey).finally(() => requests5.delete(key));
    requests5.set(key, pending);
  }
  return (await pending).clone();
  async function loadIncidents(apiKey2) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...credentialHeaders(omlConfig),
          "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        return failure7(response.status, "Unable to load incidents");
      }
      const overview = await response.json();
      if (!overview || typeof overview !== "object" || Array.isArray(overview))
        return failure7(502, "Invalid incidents response");
      if (cache5.size >= MAX_CACHE_ENTRIES5)
        cache5.delete(cache5.keys().next().value);
      if (!omlConfig.authToken) cache5.set(key, { overview, expiresAt: Date.now() + CACHE_TTL_MS5 });
      return Response.json(overview, { headers: headers6 });
    } catch (error) {
      return error instanceof Error && error.name === "TimeoutError" ? failure7(504, "incidents request timed out") : failure7(502, "Unable to reach the dashboard service");
    }
  }
}
var CACHE_TTL_MS5, MAX_CACHE_ENTRIES5, cache5, requests5, headers6, failure7;
var init_dashboard_incidents = __esm({
  "src/dashboard-server/dashboard-incidents.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS5 = 3e4;
    MAX_CACHE_ENTRIES5 = 16;
    cache5 = /* @__PURE__ */ new Map();
    requests5 = /* @__PURE__ */ new Map();
    headers6 = { "Cache-Control": "no-store" };
    failure7 = (status, error) => Response.json({ error }, { status, headers: headers6 });
  }
});

// src/dashboard-server/stream-limit.ts
function acquireStream(key) {
  const now = Date.now();
  for (const [scope, state2] of scopes) {
    state2.starts = state2.starts.filter((time) => time > now - WINDOW_MS);
    if (!state2.active && !state2.starts.length) scopes.delete(scope);
  }
  const state = scopes.get(key) ?? { starts: [], active: 0 };
  if (state.active >= MAX_ACTIVE || state.starts.length >= MAX_STARTS || !scopes.has(key) && scopes.size >= MAX_SCOPES) {
    const seconds = Math.max(1, Math.ceil(((state.starts[0] ?? now) + WINDOW_MS - now) / 1e3));
    return Response.json({ error: "Too many log stream connections. Please retry shortly." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(seconds) } });
  }
  state.starts.push(now);
  state.active++;
  scopes.set(key, state);
  let released = false;
  return { release() {
    if (!released) {
      released = true;
      state.active--;
    }
  } };
}
var WINDOW_MS, MAX_STARTS, MAX_ACTIVE, MAX_SCOPES, scopes;
var init_stream_limit = __esm({
  "src/dashboard-server/stream-limit.ts"() {
    "use strict";
    WINDOW_MS = 3e4;
    MAX_STARTS = 6;
    MAX_ACTIVE = 3;
    MAX_SCOPES = 1024;
    scopes = /* @__PURE__ */ new Map();
  }
});

// src/dashboard-server/dashboard-realtime-logs-stream.ts
async function GET8(omlConfig, request) {
  const query = new URL(request.url).searchParams;
  const ranges = query.getAll("range");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "7d")
    return fail2(400, "range must be 7d");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return fail2(503, "Dashboard connection is not configured");
  let url;
  try {
    url = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw Error();
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/dashboard/realtime-logs/stream`;
    url.search = new URLSearchParams({ range: "7d" }).toString();
  } catch {
    return fail2(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([url.href, apiKey, omlConfig.projectName]));
  const slot = acquireStream(key);
  if (slot instanceof Response) return slot;
  const abort = new AbortController();
  const disconnect = () => {
    slot.release();
    abort.abort();
  };
  request.signal.addEventListener("abort", disconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(
    () => abort.abort(new DOMException("Connection timed out", "TimeoutError")),
    15e3
  );
  const cleanup = () => {
    slot.release();
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", disconnect);
  };
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "text/event-stream",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: abort.signal
    });
    clearTimeout(timeout);
    if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.includes("text/event-stream")) {
      await upstream.body?.cancel();
      cleanup();
      abort.abort();
      return fail2(
        upstream.ok ? 502 : upstream.status,
        "Unable to connect realtime logs"
      );
    }
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            cleanup();
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch {
          cleanup();
          abort.abort();
          controller.error(new Error("Realtime log stream disconnected"));
        }
      },
      async cancel() {
        cleanup();
        abort.abort();
        await reader.cancel().catch(() => void 0);
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no"
      }
    });
  } catch {
    cleanup();
    abort.abort();
    return fail2(502, "Unable to connect realtime logs");
  }
}
var fail2;
var init_dashboard_realtime_logs_stream = __esm({
  "src/dashboard-server/dashboard-realtime-logs-stream.ts"() {
    "use strict";
    init_stream_limit();
    init_config();
    fail2 = (status, error) => Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
});

// src/dashboard-server/dashboard-api-performance-logs.ts
async function GET9(omlConfig, request) {
  const query = new URL(request.url).searchParams;
  const methods = query.getAll("method"), endpoints = query.getAll("endpoint"), ranges = query.getAll("range");
  const method = methods[0], endpoint = endpoints[0];
  if (methods.length !== 1 || !/^[A-Z]{1,16}$/.test(method || ""))
    return fail3(400, "Valid method is required");
  if (endpoints.length !== 1 || !endpoint || endpoint.length > 1e3 || /[\u0000-\u001f\u007f]/.test(endpoint))
    return fail3(400, "Valid endpoint is required");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "7d")
    return fail3(400, "range must be 7d");
  const cursors = query.getAll("cursor");
  if (cursors.length > 1 || cursors.length === 1 && (cursors[0].length > 600 || !/^[A-Za-z0-9_-]+$/.test(cursors[0])))
    return fail3(400, "Invalid cursor");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return fail3(503, "Dashboard connection is not configured");
  let url;
  try {
    url = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw Error();
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/dashboard/api-performance/logs`;
    url.search = new URLSearchParams({
      method,
      endpoint,
      range: "7d"
    }).toString();
    if (cursors.length) url.searchParams.set("cursor", cursors[0]);
  } catch {
    return fail3(503, "Dashboard connection is not configured");
  }
  const abort = new AbortController();
  const disconnect = () => abort.abort();
  request.signal.addEventListener("abort", disconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(
    () => abort.abort(new DOMException("Connection timed out", "TimeoutError")),
    15e3
  );
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", disconnect);
  };
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: abort.signal
    });
    if (!upstream.ok)
      return fail3(upstream.status, "Unable to load older endpoint logs");
    const page = await upstream.json();
    if (!page || typeof page !== "object" || !("logs" in page) || !Array.isArray(page.logs))
      return fail3(502, "Invalid endpoint history response");
    return Response.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail3(502, "Unable to load older endpoint logs");
  } finally {
    cleanup();
  }
}
var fail3;
var init_dashboard_api_performance_logs = __esm({
  "src/dashboard-server/dashboard-api-performance-logs.ts"() {
    "use strict";
    init_config();
    fail3 = (status, error) => Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
});

// src/dashboard-server/dashboard-api-performance-logs-stream.ts
async function GET10(omlConfig, request) {
  const query = new URL(request.url).searchParams;
  const methods = query.getAll("method"), endpoints = query.getAll("endpoint"), ranges = query.getAll("range");
  const method = methods[0], endpoint = endpoints[0];
  if (methods.length !== 1 || !/^[A-Z]{1,16}$/.test(method || ""))
    return fail4(400, "Valid method is required");
  if (endpoints.length !== 1 || !endpoint || endpoint.length > 1e3 || /[\u0000-\u001f\u007f]/.test(endpoint))
    return fail4(400, "Valid endpoint is required");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "7d")
    return fail4(400, "range must be 7d");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return fail4(503, "Dashboard connection is not configured");
  let url;
  try {
    url = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw Error();
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/dashboard/api-performance/logs/stream`;
    url.search = new URLSearchParams({
      method,
      endpoint,
      range: "7d"
    }).toString();
  } catch {
    return fail4(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([url.href, apiKey, omlConfig.projectName]));
  const slot = acquireStream(key);
  if (slot instanceof Response) return slot;
  const abort = new AbortController();
  const disconnect = () => {
    slot.release();
    abort.abort();
  };
  request.signal.addEventListener("abort", disconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(
    () => abort.abort(new DOMException("Connection timed out", "TimeoutError")),
    15e3
  );
  const cleanup = () => {
    slot.release();
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", disconnect);
  };
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "text/event-stream",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: abort.signal
    });
    clearTimeout(timeout);
    if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.includes("text/event-stream")) {
      await upstream.body?.cancel();
      cleanup();
      abort.abort();
      return fail4(
        upstream.ok ? 502 : upstream.status,
        "Unable to connect endpoint logs"
      );
    }
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            cleanup();
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch {
          cleanup();
          abort.abort();
          controller.error(new Error("Endpoint log stream disconnected"));
        }
      },
      async cancel() {
        cleanup();
        abort.abort();
        await reader.cancel().catch(() => void 0);
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no"
      }
    });
  } catch {
    cleanup();
    abort.abort();
    return fail4(502, "Unable to connect endpoint logs");
  }
}
var fail4;
var init_dashboard_api_performance_logs_stream = __esm({
  "src/dashboard-server/dashboard-api-performance-logs-stream.ts"() {
    "use strict";
    init_stream_limit();
    init_config();
    fail4 = (status, error) => Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
});

// src/dashboard-server/dashboard-incidents-incident-logs.ts
async function GET11(omlConfig, request, context) {
  const { conditionKey } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(conditionKey))
    return fail5(400, "Invalid incident condition key");
  const query = new URL(request.url).searchParams;
  const ranges = query.getAll("range");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "24h")
    return fail5(400, "range must be 24h");
  const cursors = query.getAll("cursor");
  if (cursors.length > 1 || cursors.length === 1 && (cursors[0].length > 600 || !/^[A-Za-z0-9_-]+$/.test(cursors[0])))
    return fail5(400, "Invalid cursor");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return fail5(503, "Dashboard connection is not configured");
  let url;
  try {
    url = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw Error();
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/dashboard/incidents/${conditionKey}/logs`;
    url.search = new URLSearchParams({
      range: "24h"
    }).toString();
    if (cursors.length) url.searchParams.set("cursor", cursors[0]);
  } catch {
    return fail5(503, "Dashboard connection is not configured");
  }
  const abort = new AbortController();
  const disconnect = () => abort.abort();
  request.signal.addEventListener("abort", disconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(
    () => abort.abort(new DOMException("Connection timed out", "TimeoutError")),
    15e3
  );
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", disconnect);
  };
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: abort.signal
    });
    if (!upstream.ok)
      return fail5(upstream.status, "Unable to load older incident logs");
    const page = await upstream.json();
    if (!page || typeof page !== "object" || !("logs" in page) || !Array.isArray(page.logs))
      return fail5(502, "Invalid endpoint history response");
    return Response.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail5(502, "Unable to load older incident logs");
  } finally {
    cleanup();
  }
}
var fail5;
var init_dashboard_incidents_incident_logs = __esm({
  "src/dashboard-server/dashboard-incidents-incident-logs.ts"() {
    "use strict";
    init_config();
    fail5 = (status, error) => Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
});

// src/dashboard-server/dashboard-incidents-incident-logs-stream.ts
async function GET12(omlConfig, request, context) {
  const { conditionKey } = await context.params;
  if (!/^[a-f0-9]{64}$/.test(conditionKey))
    return fail6(400, "Invalid incident condition key");
  const query = new URL(request.url).searchParams;
  const ranges = query.getAll("range");
  if (ranges.length > 1 || ranges.length === 1 && ranges[0] !== "24h")
    return fail6(400, "range must be 24h");
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return fail6(503, "Dashboard connection is not configured");
  let url;
  try {
    url = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw Error();
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/dashboard/incidents/${conditionKey}/logs/stream`;
    url.search = new URLSearchParams({ range: "24h" }).toString();
  } catch {
    return fail6(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([url.href, apiKey, omlConfig.projectName]));
  const slot = acquireStream(key);
  if (slot instanceof Response) return slot;
  const abort = new AbortController();
  const disconnect = () => {
    slot.release();
    abort.abort();
  };
  request.signal.addEventListener("abort", disconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(
    () => abort.abort(new DOMException("Connection timed out", "TimeoutError")),
    15e3
  );
  const cleanup = () => {
    slot.release();
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", disconnect);
  };
  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "text/event-stream",
        ...credentialHeaders(omlConfig),
        "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
      },
      cache: "no-store",
      redirect: "error",
      signal: abort.signal
    });
    clearTimeout(timeout);
    if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.includes("text/event-stream")) {
      await upstream.body?.cancel();
      cleanup();
      abort.abort();
      return fail6(
        upstream.ok ? 502 : upstream.status,
        "Unable to connect incident logs"
      );
    }
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            cleanup();
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch {
          cleanup();
          abort.abort();
          controller.error(new Error("Realtime log stream disconnected"));
        }
      },
      async cancel() {
        cleanup();
        abort.abort();
        await reader.cancel().catch(() => void 0);
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no"
      }
    });
  } catch {
    cleanup();
    abort.abort();
    return fail6(502, "Unable to connect incident logs");
  }
}
var fail6;
var init_dashboard_incidents_incident_logs_stream = __esm({
  "src/dashboard-server/dashboard-incidents-incident-logs-stream.ts"() {
    "use strict";
    init_stream_limit();
    init_config();
    fail6 = (status, error) => Response.json(
      { error },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
});

// src/dashboard-server/billing-usage.ts
async function GET13(omlConfig) {
  const apiKey = omlConfig.authToken?.trim() || omlConfig.apiKey?.trim();
  if (!apiKey || !omlConfig.projectName)
    return failure8(503, "Dashboard connection is not configured");
  let endpoint;
  try {
    const base = new URL(
      omlConfig.baseUrl?.trim() || process.env.OML_BASE_URL?.trim() || "https://api.oneminutelogs.com/api/v2"
    );
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.protocol === "http:" && (process.env.NODE_ENV !== "development" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))
      throw new Error("Invalid OML base URL");
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/billing/usage`;
    endpoint = base;
  } catch {
    return failure8(503, "Dashboard connection is not configured");
  }
  const key = await hashScope(JSON.stringify([endpoint.href, apiKey, omlConfig.projectName]));
  const cached = cache6.get(key);
  if (!omlConfig.authToken && cached && cached.expiresAt > Date.now())
    return Response.json(cached.overview, { headers: headers7 });
  cache6.delete(key);
  if (omlConfig.authToken) return loadOverview(apiKey);
  let pending = requests6.get(key);
  if (!pending) {
    pending = loadUsage(apiKey).finally(() => requests6.delete(key));
    requests6.set(key, pending);
  }
  return (await pending).clone();
  async function loadUsage(apiKey2) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...credentialHeaders(omlConfig),
          "x-oml-project-name": encodeURIComponent(omlConfig.projectName)
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        return failure8(response.status, "Unable to load billing usage");
      }
      const overview = await response.json();
      if (!overview || typeof overview !== "object" || Array.isArray(overview))
        return failure8(502, "Invalid billing usage response");
      if (cache6.size >= MAX_CACHE_ENTRIES6)
        cache6.delete(cache6.keys().next().value);
      if (!omlConfig.authToken) cache6.set(key, { overview, expiresAt: Date.now() + CACHE_TTL_MS6 });
      return Response.json(overview, { headers: headers7 });
    } catch (error) {
      return error instanceof Error && error.name === "TimeoutError" ? failure8(504, "billing usage request timed out") : failure8(502, "Unable to reach the dashboard service");
    }
  }
}
var CACHE_TTL_MS6, MAX_CACHE_ENTRIES6, cache6, requests6, headers7, failure8;
var init_billing_usage = __esm({
  "src/dashboard-server/billing-usage.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS6 = 3e4;
    MAX_CACHE_ENTRIES6 = 16;
    cache6 = /* @__PURE__ */ new Map();
    requests6 = /* @__PURE__ */ new Map();
    headers7 = { "Cache-Control": "no-store" };
    failure8 = (status, error) => Response.json({ error }, { status, headers: headers7 });
  }
});

// src/dashboard-server/index.ts
var dashboard_server_exports = {};
__export(dashboard_server_exports, {
  dashboardMethods: () => dashboardMethods,
  dispatchDashboard: () => dispatchDashboard
});
function dashboardMethods(operation) {
  if (routes[operation]) return Object.keys(routes[operation]);
  if (/^dashboard\/incidents\/[a-f0-9]{64}\/logs(?:\/stream)?$/.test(operation))
    return ["GET"];
  return void 0;
}
async function dispatchDashboard(config, request, operation) {
  const handler = routes[operation]?.[request.method];
  if (handler) return handler(config, request);
  const match = /^dashboard\/incidents\/([a-f0-9]{64})\/logs(\/stream)?$/.exec(
    operation
  );
  if (match && request.method === "GET") {
    const context = { params: Promise.resolve({ conditionKey: match[1] }) };
    return match[2] ? GET12(config, request, context) : GET11(config, request, context);
  }
  return Response.json(
    { error: "Unknown dashboard operation" },
    { status: 404 }
  );
}
var routes;
var init_dashboard_server = __esm({
  "src/dashboard-server/index.ts"() {
    "use strict";
    init_billing_checkout();
    init_alerts_custom_rules();
    init_dashboard_realtime_logs();
    init_dashboard_browser_health();
    init_dashboard_recent_logs();
    init_dashboard_overview();
    init_dashboard_api_performance();
    init_dashboard_incidents();
    init_dashboard_realtime_logs_stream();
    init_dashboard_api_performance_logs();
    init_dashboard_api_performance_logs_stream();
    init_dashboard_incidents_incident_logs();
    init_dashboard_incidents_incident_logs_stream();
    init_billing_usage();
    routes = {
      "alerts/custom-rules": {
        GET,
        POST: POST2,
        DELETE
      },
      "dashboard/realtime-logs": { GET: GET2 },
      "dashboard/browser-health": { GET: GET3 },
      "dashboard/recent-logs": { GET: GET4 },
      "dashboard/overview": { GET: GET5 },
      "dashboard/api-performance": { GET: GET6 },
      "dashboard/incidents": { GET: GET7 },
      "dashboard/realtime-logs/stream": { GET: GET8 },
      "dashboard/api-performance/logs": { GET: GET9 },
      "dashboard/api-performance/logs/stream": { GET: GET10 },
      "billing/checkout": { POST },
      "billing/portal": {
        POST: (config, request) => POST(config, request, true)
      },
      "billing/usage": { GET: GET13 }
    };
  }
});

// ../oneminutelogs-browser/dist/server/config.js
function rumIngestionUrl() {
  return "https://api.oneminutelogs.com/api/v2/rum/batches";
}
var init_config2 = __esm({
  "../oneminutelogs-browser/dist/server/config.js"() {
    "use strict";
  }
});

// ../oneminutelogs-browser/dist/server/index.js
var server_exports = {};
__export(server_exports, {
  handleBrowserRequest: () => handleBrowserRequest
});
async function boundedRead(body, limit, signal) {
  if (!body)
    return new Uint8Array();
  const reader = body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {
    });
  };
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted)
    cancel();
  const chunks = [];
  let length = 0;
  try {
    for (; ; ) {
      const chunk = await reader.read();
      if (signal.aborted)
        throw new RequestFailure(504, "RUM forwarding cancelled");
      if (chunk.done)
        break;
      length += chunk.value.byteLength;
      if (length > limit)
        throw new RequestFailure(413, "Request body too large");
      chunks.push(chunk.value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    void reader.cancel().catch(() => {
    });
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
async function handleBrowserRequest(request, options) {
  if (typeof window !== "undefined")
    throw new Error("@oneminutelogs/browser/server is server-only");
  if (request.method !== "POST")
    return errorResponse(405, "Only POST is supported", { Allow: "POST" });
  const apiKey = options.apiKey?.trim();
  if (!apiKey || /[\r\n]/.test(apiKey))
    return errorResponse(503, "RUM forwarding is not configured");
  const projectName = options.projectName?.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!projectName || [...projectName].length > 120 || /[\u0000-\u001f\u007f]/.test(projectName))
    return errorResponse(503, "RUM forwarding is not configured");
  const environment = typeof options.environment === "string" ? options.environment.trim() : "";
  if (!environment || environment.length > 128 || !/^[A-Za-z0-9_.-]+$/.test(environment))
    return errorResponse(503, "RUM environment is not configured");
  const routeTemplates = options.routeTemplates ?? [];
  const endpointTemplates = options.endpointTemplates ?? [];
  if (!Array.isArray(routeTemplates) || !Array.isArray(endpointTemplates))
    return errorResponse(503, "RUM forwarding is not configured");
  const templates = [...routeTemplates, ...endpointTemplates];
  if (!Array.isArray(routeTemplates) || !Array.isArray(endpointTemplates) || endpointTemplates.length > 64 || routeTemplates.length > 64 || templates.some((route) => typeof route !== "string" || route.length > 256 || !(route === "/" || /^\/(?:[A-Za-z0-9_-]+|\[(?:\.\.\.)?[A-Za-z0-9_]+\]|\[\[\.\.\.[A-Za-z0-9_]+\]\])(?:\/(?:[A-Za-z0-9_-]+|\[(?:\.\.\.)?[A-Za-z0-9_]+\]|\[\[\.\.\.[A-Za-z0-9_]+\]\]))*$/.test(route))) || JSON.stringify(routeTemplates).length > 8192 || JSON.stringify(endpointTemplates).length > 8192)
    return errorResponse(503, "RUM forwarding is not configured");
  try {
    const origin = request.headers.get("Origin");
    const requestUrl = new URL(request.url);
    const host = request.headers.get("Host");
    if (host) {
      const authority = new URL(`${requestUrl.protocol}//${host}`);
      if (authority.host !== host.toLowerCase() || authority.username || authority.password)
        return errorResponse(400, "Invalid request authority");
      requestUrl.host = authority.host;
    }
    if (origin !== null && origin !== requestUrl.origin || request.headers.get("Sec-Fetch-Site") === "cross-site")
      return errorResponse(403, "Cross-origin submissions are not supported");
    if (request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !== "application/json")
      return errorResponse(415, "Content-Type must be application/json");
    const encoding = request.headers.get("Content-Encoding");
    if (encoding && encoding.toLowerCase() !== "identity")
      return errorResponse(415, "Encoded request bodies are not supported");
    const declared = request.headers.get("Content-Length");
    if (declared !== null) {
      if (!/^\d+$/.test(declared))
        return errorResponse(400, "Invalid Content-Length");
      if (Number(declared) > BODY_LIMIT)
        return errorResponse(413, "Request body too large");
    }
    const abort = new AbortController();
    let timer;
    const aborted = () => abort.abort();
    request.signal.addEventListener("abort", aborted, { once: true });
    if (request.signal.aborted)
      abort.abort();
    try {
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
          abort.abort();
          reject(new RequestFailure(504, "RUM forwarding timed out"));
        }, 5e3);
      });
      const forward = async () => {
        const bytes = await boundedRead(request.body, BODY_LIMIT, abort.signal);
        let envelope;
        try {
          envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        } catch {
          return errorResponse(400, "Invalid JSON batch");
        }
        if (!envelope || envelope.schemaVersion !== 1 || typeof envelope.batchId !== "string" || !envelope.batchId.length || envelope.batchId.length > 128 || !Array.isArray(envelope.events) || !envelope.events.length || envelope.events.length > 1e3 || envelope.events.some((event) => !event || typeof event !== "object" || Array.isArray(event)))
          return errorResponse(400, "Invalid batch envelope");
        const upstream = await (options.fetch ?? fetch)(rumIngestionUrl(), {
          method: "POST",
          body: bytes,
          signal: abort.signal,
          redirect: "error",
          credentials: "omit",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-api-key": apiKey,
            "x-oml-project-name": encodeURIComponent(projectName),
            "x-oml-environment": environment,
            "x-oml-route-templates": JSON.stringify(routeTemplates),
            "x-oml-endpoint-templates": JSON.stringify(endpointTemplates)
          }
        });
        if (!upstream.ok) {
          void upstream.body?.cancel().catch(() => {
          });
          const headers8 = {};
          const retryAfter = upstream.headers.get("Retry-After");
          if (retryAfter && retryAfter.length <= 128 && (/^\d+$/.test(retryAfter) || Number.isFinite(Date.parse(retryAfter))))
            headers8["Retry-After"] = retryAfter;
          return errorResponse(upstream.status >= 300 && upstream.status < 400 ? 502 : upstream.status, "RUM upstream rejected the batch", headers8);
        }
        let ack;
        try {
          ack = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await boundedRead(upstream.body, ACK_LIMIT, abort.signal)));
        } catch {
          return uncertainResponse(502, "Invalid upstream acknowledgement");
        }
        if (ack?.batchId !== envelope.batchId || ack.accepted !== true)
          return uncertainResponse(502, "Missing matching whole-batch acknowledgement");
        return Response.json({ batchId: envelope.batchId, accepted: true }, { headers: { "Cache-Control": "no-store" } });
      };
      return await Promise.race([forward(), deadline]);
    } finally {
      clearTimeout(timer);
      abort.abort();
      request.signal.removeEventListener("abort", aborted);
    }
  } catch (error) {
    const respond = error instanceof RequestFailure && error.status === 413 ? errorResponse : uncertainResponse;
    return respond(error instanceof RequestFailure ? error.status : 502, error instanceof RequestFailure ? error.message : "RUM forwarding failed");
  }
}
var BODY_LIMIT, ACK_LIMIT, RequestFailure, errorResponse, uncertainResponse;
var init_server = __esm({
  "../oneminutelogs-browser/dist/server/index.js"() {
    "use strict";
    init_config2();
    BODY_LIMIT = 64 * 1024;
    ACK_LIMIT = 4096;
    RequestFailure = class extends Error {
      status;
      constructor(status, message) {
        super(message);
        this.status = status;
      }
    };
    errorResponse = (status, message, headers8) => Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store", ...headers8 } });
    uncertainResponse = (status, message) => errorResponse(status, message, { "X-OML-Delivery": "uncertain" });
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OMLTransport: () => OMLTransport,
  createLogger: () => createLogger,
  forwardRequest: () => forwardRequest,
  getLogs: () => getLogs,
  getStream: () => getStream,
  handleProcessRequest: () => handleProcessRequest
});
module.exports = __toCommonJS(index_exports);

// src/logger-config.ts
var configurations = /* @__PURE__ */ new WeakMap();
function rememberLogger(logger, config) {
  configurations.set(logger, { ...config });
  return logger;
}
function loggerConfiguration(logger) {
  return logger && configurations.get(logger);
}

// src/core/index.ts
init_configs();

// src/utils/index.ts
init_configs();
var MAX_BUFFER_SIZE = 1e4;
var FLUSH_INTERVAL_MS = 2e3;
var liveTransports = /* @__PURE__ */ new Set();
var sharedTransports = /* @__PURE__ */ new Map();
var shutdownHooksInstalled = false;
function installShutdownHooks() {
  if (shutdownHooksInstalled) return;
  if (typeof process === "undefined" || typeof process.on !== "function") return;
  shutdownHooksInstalled = true;
  const flushAll = () => Promise.allSettled([...liveTransports].map((t) => t.flushNow()));
  process.on("beforeExit", () => {
    void flushAll();
  });
  const onSignal = (signal) => {
    void flushAll().finally(() => {
      process.removeListener(signal, onSignal);
      process.kill(process.pid, signal);
    });
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
}
var OMLTransport = class _OMLTransport {
  constructor(config) {
    this.config = config;
    const envConfig = getEnvConfig();
    this.baseUrl = envConfig.baseUrl;
    this.apiKey = config.apiKey;
    this.appName = config.projectName;
    this.environment = config.environment;
    this.headers = {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      ...config.projectName ? { "x-app-name": config.projectName } : {},
      ...config.environment ? { "x-env": config.environment } : {}
    };
    liveTransports.add(this);
    installShutdownHooks();
  }
  config;
  baseUrl;
  apiKey;
  appName;
  environment;
  headers;
  buffer = [];
  timer = null;
  shuttingDown = false;
  isFlushing = false;
  droppedLogs = 0;
  /**
   * Returns a process-wide shared transport for the given config, keyed by
   * base URL + API key, so repeated `createLogger` calls don't leak buffers
   * or process listeners.
   */
  static getShared(config) {
    const key = `${getEnvConfig().baseUrl}::${config.apiKey}`;
    let transport = sharedTransports.get(key);
    if (!transport) {
      transport = new _OMLTransport(config);
      sharedTransports.set(key, transport);
    }
    return transport;
  }
  /** Queues a single log record for sending. */
  async send(payload) {
    if (this.shuttingDown) return;
    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.buffer.shift();
      this.droppedLogs++;
      if (this.droppedLogs === 1 || this.droppedLogs % 1e3 === 0) {
        console.warn(
          `OMLTransport: log buffer full (${MAX_BUFFER_SIZE}); dropped ${this.droppedLogs} record(s) so far`
        );
      }
    }
    this.buffer.push(payload);
    this.scheduleFlush(FLUSH_INTERVAL_MS);
  }
  /** Flushes immediately and stops accepting new logs. Used by shutdown hooks. */
  async flushNow() {
    this.shuttingDown = true;
    await this.flush();
  }
  scheduleFlush(delay) {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      void this.flush();
    }, delay);
  }
  buildReadHeaders(options) {
    return {
      ...options?.authToken ? { Authorization: `Bearer ${options.authToken}` } : { "x-api-key": this.apiKey },
      ...this.appName ? { "x-app-name": this.appName } : {},
      ...this.environment ? { "x-env": this.environment } : {}
    };
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
      const response = await fetch(`${this.baseUrl}/logs/send`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ logs: batch }),
        keepalive: true
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`);
      }
    } catch (err) {
      console.error("OMLTransport flush failed:", err);
      if (!this.shuttingDown && this.buffer.length + batch.length <= MAX_BUFFER_SIZE) {
        this.buffer.unshift(...batch);
        this.scheduleFlush(FLUSH_INTERVAL_MS * 2);
      } else {
        this.droppedLogs += batch.length;
      }
    } finally {
      this.isFlushing = false;
    }
  }
  /** Retrieves historical logs from the server. */
  async get(filters, options) {
    const headers8 = this.buildReadHeaders(options);
    const res = await fetch(`${this.baseUrl}/logs${toQueryString(filters)}`, {
      headers: headers8
    });
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
      body: JSON.stringify({ signature, timestamp, body })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message ?? "Failed to verify webhook.");
    }
    return result;
  }
  /** Opens a Server-Sent Events (SSE) stream of live logs (raw byte stream). */
  stream(filters, options) {
    const url = `${this.baseUrl}/logs/stream${toQueryString(filters)}`;
    const headers8 = this.buildReadHeaders(options);
    const abortController = new AbortController();
    const body = new ReadableStream({
      start: async (controller) => {
        try {
          const res = await fetch(url, {
            headers: headers8,
            signal: abortController.signal
          });
          if (!res.body) {
            controller.error(new Error("Upstream stream unavailable"));
            return;
          }
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        abortController.abort();
      }
    });
    return { body };
  }
};
function toQueryString(filters) {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === void 0 || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// src/core/index.ts
function normalizeTimestamp(value) {
  const date = value instanceof Date ? value : value === void 0 ? /* @__PURE__ */ new Date() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      "timestamp must be a valid Date, ISO date string, or Unix timestamp"
    );
  }
  return date.toISOString();
}
function createLogger(config) {
  if (!config.apiKey) throw new TypeError("apiKey is required");
  if (!config.projectName) throw new TypeError("projectName is required");
  const transport = OMLTransport.getShared(config);
  const send = async (payload) => {
    if (!payload.message) throw new TypeError("message is required");
    const record = {
      projectName: config.projectName,
      serviceName: config.serviceName ?? config.projectName,
      environment: config.environment ?? process.env.NODE_ENV ?? "development",
      level: payload.level ?? "info",
      message: payload.message,
      ...payload.eventName ? { eventName: payload.eventName } : {},
      timestamp: normalizeTimestamp(payload.timestamp),
      attributes: { ...config.defaultAttributes, ...payload.attributes },
      resource: {
        ...config.serviceVersion ? { "service.version": config.serviceVersion } : {},
        "process.runtime.name": "node",
        "process.runtime.version": process.versions?.node ?? ""
      },
      scope: { name: SDK_NAME, version: SDK_VERSION },
      ...payload.traceId ? { traceId: payload.traceId } : {},
      ...payload.spanId ? { spanId: payload.spanId } : {}
    };
    await transport.send(record);
  };
  const atLevel = (level) => (payload) => send({ ...payload, level });
  return rememberLogger({
    send,
    trace: atLevel("trace"),
    debug: atLevel("debug"),
    info: atLevel("info"),
    warn: atLevel("warn"),
    warning: atLevel("warn"),
    error: atLevel("error"),
    fatal: atLevel("fatal"),
    verifyWebhook: (options) => transport.verifyWebhook(options),
    /** Query historical logs. Returns `{ logs, count, totalCount, ... }`. */
    get: (filters, options) => transport.get(filters, options),
    /** Raw SSE byte stream — consumed by `handleProcessRequest`. */
    stream: (filters, options) => transport.stream(filters, options)
  }, config);
}

// src/processRequest.ts
init_request_origin();
init_configs();
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
  projectName,
  environment
}) => ({
  "x-api-key": apiKey,
  ...projectName ? { "x-app-name": projectName } : {},
  ...environment ? { "x-env": environment } : {}
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
  projectName,
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
  if (!logger && !apiKey && !authToken) {
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
  const filters = Object.fromEntries(
    requestUrl.searchParams.entries()
  );
  if (logger && !authToken) {
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
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : buildHeaders({ apiKey, projectName, environment }),
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
function forwardRequest(options) {
  const basePath = (options.basePath ?? "/api/oneminutelogs").replace(/\/+$/, "");
  if (!basePath.startsWith("/") || basePath.includes("?") || basePath.includes("#")) {
    throw new TypeError("OneMinute Logs basePath must be an absolute URL path");
  }
  return async (request) => {
    const pathname = new URL(request.url).pathname;
    const operation = pathname.startsWith(basePath + "/") ? pathname.slice(basePath.length + 1).replace(/\/$/, "") : "";
    const tokenMode = typeof options.authToken === "string" && options.authToken.trim().length > 0;
    if (operation.startsWith("dashboard/") || (operation === "billing/usage" || operation === "billing/checkout" || operation === "billing/portal") || operation === "alerts/custom-rules") {
      const { isAdmin: isAdmin2 } = await Promise.resolve().then(() => (init_admin_auth(), admin_auth_exports));
      if (!tokenMode && !await isAdmin2(request, options.admin, basePath) || options.authorize && !await options.authorize(request)) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
      }
      const { dashboardMethods: dashboardMethods2, dispatchDashboard: dispatchDashboard2 } = await Promise.resolve().then(() => (init_dashboard_server(), dashboard_server_exports));
      const methods = dashboardMethods2(operation);
      if (!methods) return Response.json({ error: "Unknown dashboard endpoint" }, { status: 404 });
      if (!methods.includes(request.method)) return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: methods.join(", ") } });
      if (request.method !== "GET" && !isSameOrigin(request)) {
        return Response.json({ error: "Same-origin request required" }, { status: 403 });
      }
      const config = loggerConfiguration(options.logger);
      return dispatchDashboard2({
        apiKey: options.apiKey ?? config?.apiKey,
        authToken: tokenMode ? options.authToken : void 0,
        projectName: options.projectName ?? config?.projectName ?? "",
        baseUrl: options.baseUrl
      }, request, operation);
    }
    switch (operation) {
      case "admin/login":
      case "admin/session":
      case "admin/logout": {
        if (tokenMode) {
          if (operation !== "admin/session") return Response.json({ error: "Use your application sign-in and sign-out" }, { status: 400 });
          if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
          if (options.authorize && !await options.authorize(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
          return Response.json({ authenticated: true, authMode: "token" }, { headers: { "Cache-Control": "no-store" } });
        }
        const { handleAdmin: handleAdmin2 } = await Promise.resolve().then(() => (init_admin_auth(), admin_auth_exports));
        return handleAdmin2(request, operation, options.admin, basePath);
      }
      case "browser": {
        if (request.method !== "POST") {
          return Response.json({ error: "Method not allowed" }, {
            status: 405,
            headers: { Allow: "POST" }
          });
        }
        const loggerConfig = loggerConfiguration(options.logger);
        const browserApiKey = options.apiKey ?? loggerConfig?.apiKey;
        const browserProjectName = options.projectName ?? loggerConfig?.projectName;
        const browser = options.browser ?? (browserApiKey && browserProjectName ? {
          apiKey: browserApiKey,
          projectName: browserProjectName,
          environment: options.environment ?? loggerConfig?.environment ?? process.env.NODE_ENV ?? "development"
        } : void 0);
        if (!browser) {
          return Response.json({ error: "Browser telemetry is not configured" }, { status: 503 });
        }
        let browserServer;
        try {
          browserServer = await Promise.resolve().then(() => (init_server(), server_exports));
        } catch {
          return Response.json({ error: "Browser telemetry requires @oneminutelogs/browser to be installed" }, { status: 503 });
        }
        return browserServer.handleBrowserRequest(request, browser);
      }
      case "logs":
      case "stream":
        const { isAdmin: isAdmin2 } = await Promise.resolve().then(() => (init_admin_auth(), admin_auth_exports));
        if (!tokenMode && !await isAdmin2(request, options.admin, basePath) || options.authorize && !await options.authorize(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (request.method !== "GET") {
          return Response.json({ error: "Method not allowed" }, {
            status: 405,
            headers: { Allow: "GET" }
          });
        }
        return handleProcessRequest({ ...options, request, authorize: void 0 });
      default:
        return Response.json({ error: "Unknown OneMinute Logs endpoint" }, { status: 404 });
    }
  };
}

// src/utils/getLogs.ts
var import_react = require("react");
var inflight = /* @__PURE__ */ new Map();
var cache7 = /* @__PURE__ */ new Map();
function buildKey(params) {
  const sp = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== void 0 && v !== null && String(v).length > 0) {
      sp.append(k, String(v));
    }
  });
  return sp.toString();
}
function getLogs(filters) {
  const [data, setData] = (0, import_react.useState)(null);
  const [total, setTotal] = (0, import_react.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  const key = (0, import_react.useMemo)(() => buildKey(filters), [filters]);
  const fetchOnce = (0, import_react.useCallback)(async (k) => {
    if (cache7.has(k)) return cache7.get(k);
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
      cache7.set(k, result);
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
      const rows = Array.isArray(json) ? json : json?.logs ?? [];
      setData(rows);
      setTotal(
        typeof json?.totalCount === "number" ? json.totalCount : null
      );
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError(err);
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
    cache7.delete(key);
    await fetchLogs();
  }, [key, fetchLogs]);
  return { data, total, isLoading, error, refetch };
}

// src/utils/getStream.ts
var import_react2 = require("react");
var MAX_BUFFERED = 5e3;
function buildQuery(filters) {
  if (!filters) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== void 0 && v !== null && String(v).length > 0) {
      sp.append(k, String(v));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
function getStream(filters) {
  const [data, setData] = (0, import_react2.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [connected, setConnected] = (0, import_react2.useState)(false);
  const esRef = (0, import_react2.useRef)(null);
  const filterKey = JSON.stringify(filters ?? {});
  (0, import_react2.useEffect)(() => {
    const es = new EventSource(
      `/api/oneminutelogs/stream${buildQuery(filters)}`
    );
    esRef.current = es;
    setConnected(true);
    setIsLoading(true);
    setError(null);
    es.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        const incoming = Array.isArray(frame?.logs) ? frame.logs : [];
        setIsLoading(false);
        setData((prev) => {
          const next = frame?.type === "initial" ? incoming : [...prev, ...incoming];
          return next.length > MAX_BUFFERED ? next.slice(next.length - MAX_BUFFERED) : next;
        });
      } catch (err) {
        console.error("OML stream: failed to parse SSE message", err);
        setError(err instanceof Error ? err : new Error("SSE parse error"));
        setIsLoading(false);
      }
    };
    es.onerror = () => {
      setError((prev) => prev ?? new Error("SSE connection error"));
      setConnected(false);
    };
    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [filterKey]);
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
  forwardRequest,
  getLogs,
  getStream,
  handleProcessRequest
});
