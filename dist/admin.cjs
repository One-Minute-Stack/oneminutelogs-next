"use client";
"use strict";
"use client";
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

// src/admin.ts
var admin_exports = {};
__export(admin_exports, {
  OMLAdminGate: () => OMLAdminGate
});
module.exports = __toCommonJS(admin_exports);

// src/dashboard/request-cache.ts
var DashboardRequestCache = class {
  constructor(ttl = 3e4, maximum = 128) {
    this.ttl = ttl;
    this.maximum = maximum;
  }
  ttl;
  maximum;
  entries = /* @__PURE__ */ new Map();
  remember(key, load) {
    const previous = this.entries.get(key);
    if (previous && previous.expires > Date.now()) return previous.promise;
    this.entries.delete(key);
    while (this.entries.size >= this.maximum) this.entries.delete(this.entries.keys().next().value);
    const entry = { expires: Infinity, promise: Promise.resolve().then(load) };
    entry.promise = entry.promise.then((value) => {
      if (this.entries.get(key) === entry) entry.expires = Date.now() + this.ttl;
      return value;
    }, (error) => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, entry);
    return entry.promise;
  }
  invalidate(prefix = "") {
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
  }
  clear() {
    this.entries.clear();
  }
};

// src/dashboard/cache-context.ts
var import_react = require("react");
var DashboardCacheContext = (0, import_react.createContext)(null);

// src/admin.ts
var import_react2 = require("react");
function OMLAdminGate({ children, basePath = "/api/oneminutelogs" }) {
  const [requestCache] = (0, import_react2.useState)(() => new DashboardRequestCache());
  const [authenticated, setAuthenticated] = (0, import_react2.useState)(false);
  const [checking, setChecking] = (0, import_react2.useState)(true);
  const [password, setPassword] = (0, import_react2.useState)("");
  const [error, setError] = (0, import_react2.useState)("");
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [visible, setVisible] = (0, import_react2.useState)(false);
  const id = (0, import_react2.useId)();
  const dialog = (0, import_react2.useRef)(null);
  const base = basePath.replace(/\/$/, "");
  (0, import_react2.useEffect)(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await fetch(`${base}/admin/session`, { cache: "no-store", credentials: "same-origin" });
        if (active) {
          if (!res.ok) requestCache.clear();
          setAuthenticated(res.ok);
          if (res.status === 503) setError("Admin access is not configured on this server.");
        }
      } catch {
        if (active) {
          requestCache.clear();
          setAuthenticated(false);
          setError("Unable to verify admin session.");
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    void check();
    const timer = setInterval(check, 6e4);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [base, requestCache]);
  (0, import_react2.useEffect)(() => {
    if (!checking && !authenticated && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [checking, authenticated]);
  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${base}/admin/login`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (response.ok) {
        requestCache.clear();
        setPassword("");
        setAuthenticated(true);
      } else setError(response.status === 429 ? "Too many attempts. Try again in one minute." : response.status === 503 ? "Admin access is not configured on this server." : "Unable to sign in. Check your password.");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (checking) return (0, import_react2.createElement)("div", { role: "status", style: { minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--oml-color-000)", color: "var(--oml-color-a3a3a3)", font: "14px Arial, sans-serif" } }, "Checking admin access\u2026");
  if (authenticated) return (0, import_react2.createElement)("div", { style: { background: "var(--oml-color-000)", color: "var(--oml-color-ededed)", minHeight: "100dvh" } }, (0, import_react2.createElement)(DashboardCacheContext.Provider, { value: requestCache }, children));
  return (0, import_react2.createElement)(
    "div",
    { style: { minHeight: "100dvh", background: "var(--oml-color-000)" } },
    (0, import_react2.createElement)("style", null, `
      .oml-admin-dialog::backdrop { background: rgba(0,0,0,.88); backdrop-filter: blur(6px); }
      .oml-admin-dialog * { box-sizing: border-box; }
      .oml-admin-dialog .oml-admin-input:focus { border-color: var(--oml-color-3b82f6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,.14); }
      .oml-admin-dialog button:focus-visible { outline: 2px solid var(--oml-color-60a5fa); outline-offset: 3px; }
      .oml-admin-dialog .oml-admin-submit:not(:disabled):hover { background: var(--oml-color-2575ff) !important; }
      .oml-admin-dialog .oml-admin-reveal:hover { color: var(--oml-color-ededed) !important; }
      .oml-admin-dialog .oml-admin-submit:disabled { opacity: .5; cursor: not-allowed !important; }
      @media (max-width: 480px) { .oml-admin-dialog .oml-admin-form { padding: 28px 24px !important; } }
    `),
    (0, import_react2.createElement)(
      "dialog",
      {
        ref: dialog,
        className: "oml-admin-dialog",
        "aria-labelledby": `${id}-heading`,
        "aria-describedby": `${id}-description`,
        onCancel: (event) => event.preventDefault(),
        style: { position: "fixed", inset: 0, margin: "auto", width: 440, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", boxSizing: "border-box", border: "1px solid var(--oml-color-292929)", borderRadius: 16, padding: 0, background: "var(--oml-color-0b0b0b)", color: "var(--oml-color-ededed)", colorScheme: "var(--oml-color-scheme)", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 14, lineHeight: 1.5, boxShadow: "0 24px 100px rgba(0,0,0,.65)" }
      },
      (0, import_react2.createElement)(
        "form",
        { onSubmit: login, "aria-busy": busy, className: "oml-admin-form", style: { padding: "36px 36px 32px", margin: 0 } },
        (0, import_react2.createElement)(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 11, marginBottom: 32 } },
          (0, import_react2.createElement)(
            "svg",
            { width: 36, height: 36, viewBox: "0 0 512 512", fill: "none", "aria-hidden": true },
            (0, import_react2.createElement)("rect", { width: 512, height: 512, rx: 112, fill: "var(--oml-color-111)", stroke: "var(--oml-color-303030)", strokeWidth: 12 }),
            (0, import_react2.createElement)("path", { d: "M214 48 108 256h116l-65 208 245-256H286L358 48H214Z", fill: "var(--oml-color-66d9b5)", stroke: "var(--oml-color-a7f3d0)", strokeWidth: 18, strokeLinejoin: "round" })
          ),
          (0, import_react2.createElement)("span", { style: { fontSize: 17, fontWeight: 600, letterSpacing: "-.4px" } }, "OneMinute Logs")
        ),
        (0, import_react2.createElement)(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 7, color: "var(--oml-color-737373)", fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", marginBottom: 10 } },
          (0, import_react2.createElement)("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "var(--oml-color-66d9b5)" } }),
          "ADMIN ACCESS"
        ),
        (0, import_react2.createElement)("h2", { id: `${id}-heading`, style: { margin: "0 0 10px", fontSize: 26, fontWeight: 600, letterSpacing: "-.9px", lineHeight: 1.2 } }, "Open your dashboard"),
        (0, import_react2.createElement)("p", { id: `${id}-description`, style: { margin: "0 0 28px", color: "var(--oml-color-929292)", fontSize: 13, lineHeight: 1.7 } }, "Enter your admin password to access logs, incidents, and application health."),
        (0, import_react2.createElement)("label", { htmlFor: `${id}-password`, style: { display: "block", marginBottom: 9, fontSize: 12, fontWeight: 500, color: "var(--oml-color-d4d4d4)" } }, "Admin password"),
        (0, import_react2.createElement)(
          "div",
          { style: { position: "relative" } },
          (0, import_react2.createElement)("input", {
            id: `${id}-password`,
            className: "oml-admin-input",
            type: visible ? "text" : "password",
            autoComplete: "current-password",
            autoCapitalize: "none",
            spellCheck: false,
            minLength: 6,
            required: true,
            disabled: busy,
            value: password,
            placeholder: "Enter your password",
            "aria-invalid": error ? true : void 0,
            "aria-describedby": error ? `${id}-error` : `${id}-help`,
            onChange: (event) => setPassword(event.target.value),
            style: { appearance: "none", display: "block", margin: 0, padding: "12px 46px 12px 14px", height: 46, width: "100%", boxSizing: "border-box", background: "var(--oml-color-111)", color: "var(--oml-color-ededed)", border: `1px solid ${error ? "var(--oml-color-78413d)" : "var(--oml-color-303030)"}`, borderRadius: 8, font: "inherit", fontSize: 13, outline: "none", transition: "border-color .15s, box-shadow .15s" }
          }),
          (0, import_react2.createElement)(
            "button",
            {
              type: "button",
              className: "oml-admin-reveal",
              "aria-label": visible ? "Hide password" : "Show password",
              "aria-pressed": visible,
              onClick: () => setVisible(!visible),
              style: { position: "absolute", right: 4, top: 4, width: 38, height: 38, display: "grid", placeItems: "center", background: "transparent", border: 0, borderRadius: 5, color: "var(--oml-color-737373)", cursor: "pointer", padding: 0 }
            },
            (0, import_react2.createElement)(
              "svg",
              { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
              (0, import_react2.createElement)("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
              (0, import_react2.createElement)("circle", { cx: 12, cy: 12, r: 3 }),
              visible && (0, import_react2.createElement)("path", { d: "m3 3 18 18" })
            )
          )
        ),
        error && (0, import_react2.createElement)("div", { id: `${id}-error`, role: "alert", style: { marginTop: 12, padding: "10px 12px", borderRadius: 7, border: "1px solid var(--oml-color-472a28)", background: "var(--oml-color-201312)", color: "var(--oml-color-f2a59e)", fontSize: 12, lineHeight: 1.6 } }, error),
        (0, import_react2.createElement)("p", { id: `${id}-help`, style: { margin: "10px 0 24px", color: "var(--oml-color-737373)", fontSize: 11, lineHeight: 1.6 } }, "Use the password saved in your project\u2019s environment file."),
        (0, import_react2.createElement)(
          "button",
          {
            type: "submit",
            className: "oml-admin-submit",
            disabled: busy || [...password].length < 6,
            style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 44, border: "1px solid var(--oml-color-367dff)", borderRadius: 8, background: "var(--oml-color-0066ff)", color: "var(--oml-color-fff)", font: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background .15s, opacity .15s" }
          },
          busy ? "Unlocking dashboard\u2026" : "Unlock dashboard",
          !busy && (0, import_react2.createElement)("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, (0, import_react2.createElement)("path", { d: "M5 12h14m-5-5 5 5-5 5" }))
        )
      ),
      (0, import_react2.createElement)(
        "div",
        { style: { padding: "14px 24px", borderTop: "1px solid var(--oml-color-202020)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "var(--oml-color-666)", fontSize: 11 } },
        (0, import_react2.createElement)("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true }, (0, import_react2.createElement)("rect", { x: 5, y: 10, width: 14, height: 11, rx: 2 }), (0, import_react2.createElement)("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })),
        "Protected admin session"
      )
    )
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OMLAdminGate
});
