"use client";
"use client";

// src/dashboard/cache-context.ts
import { createContext, useContext, useRef } from "react";

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
var DashboardCacheContext = createContext(null);
function useDashboardCache() {
  const provided = useContext(DashboardCacheContext);
  const local = useRef(null);
  if (!local.current) local.current = new DashboardRequestCache();
  return provided ?? local.current;
}

// src/dashboard/page.tsx
import { useEffect as useEffect11, useState as useState11 } from "react";

// src/dashboard/lib/billing-usage.ts
var formatUsedGb = (usedGb) => (usedGb > 0 ? Math.max(0.01, usedGb) : 0).toFixed(2);
function formatUsagePercentage(usage) {
  const hasUsage = usage.percentage > 0 || usage.usedGb > 0 || Number(usage.ingestedBytes) > 0;
  if (!hasUsage) return "0.0%";
  return usage.percentage < 0.1 ? `${Math.max(0.01, usage.percentage).toFixed(2)}%` : `${usage.percentage.toFixed(1)}%`;
}
function fetchBillingUsage(cache) {
  return cache.remember(
    "/api/oneminutelogs/billing/usage",
    () => fetch("/api/oneminutelogs/billing/usage", {
      cache: "no-store",
      signal: AbortSignal.timeout(2e4)
    }).then(async (response) => {
      if (!response.ok) throw Error("Usage unavailable");
      const data = await response.json();
      if (!data.plan || !["free", "starter", "pro", "business"].includes(data.plan.name) || !data.usage || ![data.usage.usedGb, data.usage.limitGb, data.usage.percentage].every(
        (value) => Number.isFinite(value) && value >= 0
      ) || data.usage.limitGb <= 0 || !Number.isFinite(Date.parse(data.period?.end)))
        throw Error("Invalid usage response");
      return data;
    })
  );
}

// src/dashboard/apm.module.css
var apm_default = {
  apm: "apm_apm",
  detail: "apm_detail",
  summary: "apm_summary",
  error: "apm_error",
  warn: "apm_warn",
  info: "apm_info",
  panel: "apm_panel",
  panelHeading: "apm_panelHeading",
  toolbar: "apm_toolbar",
  search: "apm_search",
  selectLabel: "apm_selectLabel",
  sort: "apm_sort",
  tableScroll: "apm_tableScroll",
  endpointTable: "apm_endpointTable",
  endpointLink: "apm_endpointLink",
  method: "apm_method",
  get: "apm_get",
  post: "apm_post",
  patch: "apm_patch",
  delete: "apm_delete",
  serviceName: "apm_serviceName",
  numeric: "apm_numeric",
  sparkline: "apm_sparkline",
  openEndpoint: "apm_openEndpoint",
  tableFooter: "apm_tableFooter",
  back: "apm_back",
  detailHeading: "apm_detailHeading",
  endpointTitle: "apm_endpointTitle",
  browserLabel: "apm_browserLabel",
  logToolbar: "apm_logToolbar",
  sourceTabs: "apm_sourceTabs",
  selectedTab: "apm_selectedTab",
  matchNote: "apm_matchNote",
  logList: "apm_logList",
  entry: "apm_entry",
  entryButton: "apm_entryButton",
  source: "apm_source",
  rum: "apm_rum",
  entryMessage: "apm_entryMessage",
  duration: "apm_duration",
  entryDetail: "apm_entryDetail",
  empty: "apm_empty",
  srOnly: "apm_srOnly",
  tracePanel: "apm_tracePanel",
  traceNotice: "apm_traceNotice",
  requestChoices: "apm_requestChoices",
  requestFacts: "apm_requestFacts",
  traceLog: "apm_traceLog",
  requestNote: "apm_requestNote",
  requestGroup: "apm_requestGroup",
  logCount: "apm_logCount",
  correlationIds: "apm_correlationIds",
  requestLogTimeline: "apm_requestLogTimeline",
  requestLogMessage: "apm_requestLogMessage",
  recordedDuration: "apm_recordedDuration",
  reportCount: "apm_reportCount",
  reportList: "apm_reportList",
  reportCard: "apm_reportCard",
  reportToggle: "apm_reportToggle",
  reportChevron: "apm_reportChevron",
  reportSession: "apm_reportSession",
  reportIdentity: "apm_reportIdentity",
  reportContext: "apm_reportContext",
  unlinkedReports: "apm_unlinkedReports",
  logInspect: "apm_logInspect",
  logRowMain: "apm_logRowMain",
  logRowMetadata: "apm_logRowMetadata",
  jsonHint: "apm_jsonHint",
  logDialog: "apm_logDialog",
  dialogHeading: "apm_dialogHeading",
  logJson: "apm_logJson",
  inspectableRow: "apm_inspectableRow",
  logMessageButton: "apm_logMessageButton",
  skeleton: "apm_skeleton",
  apmShimmer: "apm_apmShimmer",
  pagination: "apm_pagination",
  detailNotice: "apm_detailNotice",
  streamTail: "apm_streamTail",
  streamTable: "apm_streamTable",
  streamError: "apm_streamError",
  newLogs: "apm_newLogs",
  historyStatus: "apm_historyStatus"
};

// src/dashboard/dashboard.module.css
var dashboard_default = {
  shell: "dashboard_shell",
  sidebar: "dashboard_sidebar",
  navigation: "dashboard_navigation",
  navItem: "dashboard_navItem",
  active: "dashboard_active",
  activeDot: "dashboard_activeDot",
  sidebarBottom: "dashboard_sidebarBottom",
  usage: "dashboard_usage",
  usageHeading: "dashboard_usageHeading",
  plan: "dashboard_plan",
  usageNumbers: "dashboard_usageNumbers",
  progress: "dashboard_progress",
  usageNote: "dashboard_usageNote",
  upgrade: "dashboard_upgrade",
  content: "dashboard_content",
  main: "dashboard_main",
  pageHeading: "dashboard_pageHeading",
  canvas: "dashboard_canvas",
  canvasIcon: "dashboard_canvasIcon",
  canvasTitle: "dashboard_canvasTitle",
  mockLabel: "dashboard_mockLabel",
  tailMain: "dashboard_tailMain"
};

// src/dashboard/overview.tsx
import { useEffect, useId, useState } from "react";

// src/dashboard/lib/dashboard-overview.ts
function fetchDashboardOverview(cache) {
  return cache.remember(
    "/api/oneminutelogs/dashboard/overview?range=24h",
    () => fetch("/api/oneminutelogs/dashboard/overview?range=24h", {
      cache: "no-store",
      signal: AbortSignal.timeout(2e4)
    }).then(async (response) => {
      if (!response.ok)
        throw new Error("Unable to load your dashboard. Please try again.");
      const data = await response.json();
      if (!data?.summary?.observedRequests || !data.summary.errorRate || !data.summary.averageResponseTime || !data.summary.activeIncidents || !Array.isArray(data.activity) || data.activity.length !== 24 || !Array.isArray(data.topServices?.items))
        throw new Error(
          "The dashboard service returned an invalid response. Please try again."
        );
      return data;
    })
  );
}

// src/dashboard/lib/dashboard-recent-logs.ts
function fetchRecentLogs(cache) {
  return cache.remember(
    "/api/oneminutelogs/dashboard/recent-logs?limit=10&range=24h",
    () => fetch(
      "/api/oneminutelogs/dashboard/recent-logs?limit=10&range=24h",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(2e4)
      }
    ).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load recent logs");
      const data = await response.json();
      if (!Array.isArray(data?.logs) || !data.logs.every(
        (log) => typeof log.id === "string" && typeof log.timestamp === "string" && Number.isFinite(Date.parse(log.timestamp)) && typeof log.message === "string" && typeof log.serviceName === "string" && ["trace", "debug", "info", "warn", "error", "fatal"].includes(
          log.level
        )
      ))
        throw new Error("Invalid recent logs response");
      return data;
    })
  );
}

// src/dashboard/overview.module.css
var overview_default = {
  overview: "overview_overview",
  metrics: "overview_metrics",
  metric: "overview_metric",
  metricLabel: "overview_metricLabel",
  metricUnit: "overview_metricUnit",
  metricLink: "overview_metricLink",
  error: "overview_error",
  warn: "overview_warn",
  info: "overview_info",
  healthGrid: "overview_healthGrid",
  panel: "overview_panel",
  panelHeader: "overview_panelHeader",
  legend: "overview_legend",
  requestSwatch: "overview_requestSwatch",
  failureSwatch: "overview_failureSwatch",
  chart: "overview_chart",
  axis: "overview_axis",
  chartReadout: "overview_chartReadout",
  readoutDivider: "overview_readoutDivider",
  serviceList: "overview_serviceList",
  serviceName: "overview_serviceName",
  serviceCount: "overview_serviceCount",
  logsPanel: "overview_logsPanel",
  filters: "overview_filters",
  selectedFilter: "overview_selectedFilter",
  logRows: "overview_logRows",
  logRow: "overview_logRow",
  level: "overview_level",
  logService: "overview_logService",
  trendUp: "overview_trendUp",
  trendDown: "overview_trendDown",
  chartWrap: "overview_chartWrap",
  chartTooltip: "overview_chartTooltip",
  tooltipTime: "overview_tooltipTime",
  periodLabel: "overview_periodLabel",
  loadState: "overview_loadState",
  retry: "overview_retry",
  emptyState: "overview_emptyState",
  activityStatus: "overview_activityStatus",
  skeleton: "overview_skeleton",
  skeletonShimmer: "overview_skeletonShimmer",
  skeletonValue: "overview_skeletonValue",
  skeletonChart: "overview_skeletonChart",
  skeletonPlot: "overview_skeletonPlot",
  skeletonService: "overview_skeletonService"
};

// src/dashboard/overview.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var number = (value) => new Intl.NumberFormat("en-US").format(value);
function Arrow() {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx("path", { d: "M4 12h16m-5-5 5 5-5 5" })
    }
  );
}
function ActivityChart({
  activity
}) {
  const requests = activity.map((bucket) => bucket.requests);
  const failures = activity.map((bucket) => bucket.failures);
  const gradient = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState(null);
  const left = 38, right = 578, top = 14, bottom = 168;
  const requestMax = Math.max(1, Math.ceil(Math.max(...requests) / 5) * 5);
  const failureMax = Math.max(
    1,
    Math.ceil(Math.max(...failures) * 1.2 / 5) * 5
  );
  const x = (index2) => left + index2 / 23 * (right - left);
  const y = (value, max) => bottom - value / max * (bottom - top);
  const requestPoints = requests.map((n, i) => `${x(i)},${y(n, requestMax)}`).join(" ");
  const failurePoints = failures.map((n, i) => `${x(i)},${y(n, failureMax)}`).join(" ");
  const index = hovered ?? 23;
  const time3 = (timestamp) => new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  });
  const timeRange = `${time3(activity[index].from)} \u2013 ${time3(activity[index].to)} UTC`;
  const hourlyLogs = activity[index].logs;
  const tooltipId = `${gradient}-tooltip`;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: overview_default.legend, children: [
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("i", { className: overview_default.requestSwatch }),
        "Requests"
      ] }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("i", { className: overview_default.failureSwatch }),
        "Failures ",
        /* @__PURE__ */ jsx("small", { children: "\xB7 right axis" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: overview_default.chartWrap, children: [
      /* @__PURE__ */ jsxs(
        "svg",
        {
          className: overview_default.chart,
          viewBox: "0 0 616 203",
          role: "img",
          "aria-label": "Observed hourly requests and failures over the last 24 hours. Requests use the left axis; failures use the right axis.",
          tabIndex: 0,
          "aria-describedby": hovered !== null ? tooltipId : void 0,
          onPointerMove: (event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const position = (event.clientX - rect.left) / rect.width * 616;
            setHovered(
              Math.max(
                0,
                Math.min(
                  23,
                  Math.round((position - left) / (right - left) * 23)
                )
              )
            );
          },
          onPointerLeave: () => setHovered(null),
          onBlur: () => setHovered(null),
          onKeyDown: (event) => {
            if (event.key === "Escape") setHovered(null);
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              setHovered(
                Math.max(
                  0,
                  Math.min(23, index + (event.key === "ArrowRight" ? 1 : -1))
                )
              );
            }
          },
          children: [
            /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: gradient, x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#0866ff", stopOpacity: ".24" }),
              /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#0866ff", stopOpacity: "0" })
            ] }) }),
            [0, 0.33, 0.66, 1].map((ratio) => /* @__PURE__ */ jsxs("g", { children: [
              /* @__PURE__ */ jsx(
                "line",
                {
                  x1: left,
                  x2: right,
                  y1: y(ratio, 1),
                  y2: y(ratio, 1),
                  stroke: "#282828",
                  strokeDasharray: "3 5"
                }
              ),
              /* @__PURE__ */ jsx(
                "text",
                {
                  x: left - 9,
                  y: y(ratio, 1) + 3,
                  textAnchor: "end",
                  className: overview_default.axis,
                  children: number(Math.round(requestMax * ratio))
                }
              ),
              /* @__PURE__ */ jsx("text", { x: right + 9, y: y(ratio, 1) + 3, className: overview_default.axis, children: Math.round(failureMax * ratio) })
            ] }, ratio)),
            /* @__PURE__ */ jsx(
              "polygon",
              {
                points: `${left},${bottom} ${requestPoints} ${right},${bottom}`,
                fill: `url(#${gradient})`
              }
            ),
            /* @__PURE__ */ jsx(
              "polyline",
              {
                points: requestPoints,
                fill: "none",
                stroke: "#4599ff",
                strokeWidth: "2.4",
                strokeLinejoin: "round"
              }
            ),
            /* @__PURE__ */ jsx(
              "polyline",
              {
                points: failurePoints,
                fill: "none",
                stroke: "#f06479",
                strokeWidth: "2",
                strokeLinejoin: "round"
              }
            ),
            [0, 6, 12, 18, 23].map((i) => /* @__PURE__ */ jsx(
              "text",
              {
                x: x(i),
                y: "193",
                textAnchor: "middle",
                className: overview_default.axis,
                children: time3(activity[i].from)
              },
              i
            )),
            hovered !== null && /* @__PURE__ */ jsxs("g", { children: [
              /* @__PURE__ */ jsx(
                "line",
                {
                  x1: x(index),
                  x2: x(index),
                  y1: top,
                  y2: bottom,
                  stroke: "#525252",
                  strokeDasharray: "3 4"
                }
              ),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: x(index),
                  cy: y(requests[index], requestMax),
                  r: "4",
                  fill: "#4599ff",
                  stroke: "#0c0c0c",
                  strokeWidth: "2"
                }
              ),
              /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: x(index),
                  cy: y(failures[index], failureMax),
                  r: "3.5",
                  fill: "#f06479",
                  stroke: "#0c0c0c",
                  strokeWidth: "2"
                }
              )
            ] })
          ]
        }
      ),
      hovered !== null && /* @__PURE__ */ jsxs(
        "div",
        {
          id: tooltipId,
          role: "tooltip",
          className: overview_default.chartTooltip,
          style: {
            left: `clamp(0px, calc(${x(index) / 616 * 100}% - 82px), calc(100% - 164px))`,
            top: `max(0px, calc(${y(requests[index], requestMax) / 203 * 100}% - 118px))`
          },
          children: [
            /* @__PURE__ */ jsx("strong", { className: overview_default.tooltipTime, children: timeRange }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Logs" }),
              /* @__PURE__ */ jsx("strong", { children: number(hourlyLogs) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("i", { className: overview_default.requestSwatch }),
                "Requests"
              ] }),
              /* @__PURE__ */ jsx("strong", { children: number(requests[index]) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("i", { className: overview_default.failureSwatch }),
                "Failures"
              ] }),
              /* @__PURE__ */ jsx("strong", { children: number(failures[index]) })
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: overview_default.chartReadout, "aria-live": "polite", children: [
      /* @__PURE__ */ jsx("span", { children: timeRange }),
      /* @__PURE__ */ jsxs("span", { children: [
        /* @__PURE__ */ jsx("strong", { children: number(hourlyLogs) }),
        " logs",
        " ",
        /* @__PURE__ */ jsx("span", { className: overview_default.readoutDivider, children: "/" }),
        " ",
        /* @__PURE__ */ jsx("strong", { children: number(requests[index]) }),
        " requests",
        " ",
        /* @__PURE__ */ jsx("span", { className: overview_default.readoutDivider, children: "/" }),
        " ",
        /* @__PURE__ */ jsx("strong", { children: failures[index] }),
        " failures"
      ] })
    ] })
  ] });
}
function SkeletonBar({
  width = "100%",
  className = ""
}) {
  return /* @__PURE__ */ jsx("span", { className: `${overview_default.skeleton} ${className}`, style: { width } });
}
function OverviewSkeleton() {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "status",
      "aria-label": "Loading application overview",
      "aria-busy": "true",
      children: /* @__PURE__ */ jsxs("div", { "aria-hidden": "true", children: [
        /* @__PURE__ */ jsx("div", { className: overview_default.metrics, children: [0, 1, 2, 3].map((index) => /* @__PURE__ */ jsxs("div", { className: overview_default.metric, children: [
          /* @__PURE__ */ jsxs("div", { className: overview_default.metricLabel, children: [
            /* @__PURE__ */ jsx(SkeletonBar, { width: index === 2 ? "150px" : "116px" }),
            /* @__PURE__ */ jsx("span", { className: overview_default.periodLabel, children: /* @__PURE__ */ jsx(SkeletonBar, { width: "78px" }) })
          ] }),
          /* @__PURE__ */ jsx("strong", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "90px", className: overview_default.skeletonValue }) }),
          /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "150px" }) })
        ] }, index)) }),
        /* @__PURE__ */ jsxs("div", { className: overview_default.healthGrid, children: [
          /* @__PURE__ */ jsxs("div", { className: overview_default.panel, children: [
            /* @__PURE__ */ jsxs("div", { className: overview_default.panelHeader, children: [
              /* @__PURE__ */ jsx("h2", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "150px" }) }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "120px" }) })
            ] }),
            /* @__PURE__ */ jsx("p", { className: overview_default.activityStatus, children: /* @__PURE__ */ jsx(SkeletonBar, { width: "65%" }) }),
            /* @__PURE__ */ jsxs("div", { className: overview_default.legend, children: [
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "68px" }) }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "105px" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: overview_default.skeletonChart, children: /* @__PURE__ */ jsx(SkeletonBar, { className: overview_default.skeletonPlot }) }),
            /* @__PURE__ */ jsxs("div", { className: overview_default.chartReadout, children: [
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "122px" }) }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "170px" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: overview_default.panel, children: [
            /* @__PURE__ */ jsxs("div", { className: overview_default.panelHeader, children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h2", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "100px" }) }),
                /* @__PURE__ */ jsx("span", { className: overview_default.periodLabel, children: /* @__PURE__ */ jsx(SkeletonBar, { width: "78px" }) })
              ] }),
              /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(SkeletonBar, { width: "60px" }) })
            ] }),
            /* @__PURE__ */ jsx("ul", { className: overview_default.serviceList, children: [0, 1, 2, 3].map((index) => /* @__PURE__ */ jsxs("li", { className: overview_default.skeletonService, children: [
              /* @__PURE__ */ jsx(SkeletonBar, { width: `${42 - index * 4}%` }),
              /* @__PURE__ */ jsx(SkeletonBar, { width: "65px" })
            ] }, index)) })
          ] })
        ] })
      ] })
    }
  );
}
function OverviewStats({
  onNavigate
}) {
  const cache = useDashboardCache();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    fetchDashboardOverview(cache).then((value) => {
      if (active) setData(value);
    }).catch(() => {
      if (active)
        setError("Unable to load your dashboard. Please try again.");
    });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (!data && !error) return /* @__PURE__ */ jsx(OverviewSkeleton, {});
  if (!data)
    return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: overview_default.loadState,
        role: error ? "alert" : "status",
        "aria-live": "polite",
        children: [
          /* @__PURE__ */ jsx("p", { children: error || "Loading your application overview\u2026" }),
          error && /* @__PURE__ */ jsx(
            "button",
            {
              className: overview_default.retry,
              onClick: () => {
                setError(null);
                setAttempt((value) => value + 1);
              },
              children: "Try again"
            }
          )
        ]
      }
    ) });
  const { observedRequests, errorRate, averageResponseTime, activeIncidents } = data.summary;
  const change = (value, lowerIsBetter = false) => value === null ? /* @__PURE__ */ jsx("span", { children: "No previous-period comparison" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "span",
      {
        className: value === 0 ? void 0 : (lowerIsBetter ? value < 0 : value > 0) ? overview_default.trendUp : overview_default.trendDown,
        children: [
          value > 0 ? "\u2197" : value < 0 ? "\u2198" : "",
          " ",
          Math.abs(value).toFixed(1),
          "%"
        ]
      }
    ),
    " ",
    /* @__PURE__ */ jsx("span", { children: "vs previous 24h" })
  ] });
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "section",
      {
        className: overview_default.metrics,
        "aria-label": "Application health summary",
        children: [
          /* @__PURE__ */ jsxs("article", { className: overview_default.metric, children: [
            /* @__PURE__ */ jsxs("span", { className: overview_default.metricLabel, children: [
              "Observed Requests",
              /* @__PURE__ */ jsx("span", { className: overview_default.periodLabel, children: "Last 24 hours" })
            ] }),
            /* @__PURE__ */ jsx("strong", { title: number(observedRequests.value), children: new Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 1
            }).format(observedRequests.value) }),
            /* @__PURE__ */ jsx("p", { children: change(observedRequests.changePercent) })
          ] }),
          /* @__PURE__ */ jsxs("article", { className: overview_default.metric, children: [
            /* @__PURE__ */ jsxs("span", { className: overview_default.metricLabel, children: [
              "Error Rate",
              /* @__PURE__ */ jsx("span", { className: overview_default.periodLabel, children: "Last 24 hours" })
            ] }),
            /* @__PURE__ */ jsx(
              "strong",
              {
                className: errorRate.valuePercent !== null && errorRate.valuePercent > 0 ? overview_default.error : void 0,
                children: errorRate.valuePercent === null ? "\u2014" : `${errorRate.valuePercent.toFixed(2)}%`
              }
            ),
            /* @__PURE__ */ jsx("p", { children: errorRate.valuePercent === null ? "No request observations" : `${number(errorRate.failures)} failed requests` })
          ] }),
          /* @__PURE__ */ jsxs("article", { className: overview_default.metric, children: [
            /* @__PURE__ */ jsxs("span", { className: overview_default.metricLabel, children: [
              "Average Response Time",
              /* @__PURE__ */ jsx("span", { className: overview_default.periodLabel, children: "Last 24 hours" })
            ] }),
            /* @__PURE__ */ jsx("strong", { children: averageResponseTime.valueMs === null ? "\u2014" : /* @__PURE__ */ jsxs(Fragment, { children: [
              number(Math.round(averageResponseTime.valueMs)),
              " ",
              /* @__PURE__ */ jsx("span", { className: overview_default.metricUnit, children: "ms" })
            ] }) }),
            /* @__PURE__ */ jsx("p", { children: averageResponseTime.valueMs === null ? "No request observations" : change(averageResponseTime.changePercent, true) })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${overview_default.metric} ${overview_default.metricLink}`,
              onClick: () => onNavigate("Incidents"),
              children: [
                /* @__PURE__ */ jsx("span", { className: overview_default.metricLabel, children: "Active Incidents" }),
                /* @__PURE__ */ jsx("strong", { children: number(activeIncidents.value) }),
                /* @__PURE__ */ jsxs("p", { children: [
                  number(activeIncidents.highPriority),
                  " high priority ",
                  /* @__PURE__ */ jsx(Arrow, {})
                ] })
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: overview_default.healthGrid, children: [
      /* @__PURE__ */ jsxs("section", { className: overview_default.panel, "aria-labelledby": "activity-heading", children: [
        /* @__PURE__ */ jsxs("div", { className: overview_default.panelHeader, children: [
          /* @__PURE__ */ jsx("h2", { id: "activity-heading", children: "Application activity" }),
          /* @__PURE__ */ jsx("span", { children: "Browser requests \xB7 UTC" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: overview_default.activityStatus, children: data.activity.every((bucket) => bucket.requests === 0) ? "No browser request observations in the last 24 hours." : "Browser request observations over the last 24 hours." }),
        /* @__PURE__ */ jsx(ActivityChart, { activity: data.activity })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: overview_default.panel, "aria-labelledby": "services-heading", children: [
        /* @__PURE__ */ jsxs("div", { className: overview_default.panelHeader, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { id: "services-heading", children: "Top Services" }),
            /* @__PURE__ */ jsx("span", { className: overview_default.periodLabel, children: "Last 24 hours" })
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            number(data.topServices.totalServices),
            " services"
          ] })
        ] }),
        data.topServices.items.length === 0 && /* @__PURE__ */ jsx("p", { className: overview_default.emptyState, children: "No service logs in the last 24 hours." }),
        /* @__PURE__ */ jsx("ul", { className: overview_default.serviceList, children: data.topServices.items.map((service) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onNavigate("Realtime Logs"),
            "aria-label": `View ${service.serviceName}: ${number(service.logs)} logs`,
            children: [
              /* @__PURE__ */ jsx("span", { className: overview_default.serviceName, children: service.serviceName }),
              /* @__PURE__ */ jsxs("span", { className: overview_default.serviceCount, children: [
                number(service.logs),
                " ",
                /* @__PURE__ */ jsx("span", { children: "logs" })
              ] })
            ]
          }
        ) }, service.serviceName)) })
      ] })
    ] })
  ] });
}
function RecentLogs({
  onNavigate
}) {
  const cache = useDashboardCache();
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    fetchRecentLogs(cache).then((data) => {
      if (active) setLogs(data.logs);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [attempt]);
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: `${overview_default.panel} ${overview_default.logsPanel}`,
      "aria-labelledby": "recent-logs-heading",
      children: [
        /* @__PURE__ */ jsxs("div", { className: overview_default.panelHeader, children: [
          /* @__PURE__ */ jsx("h2", { id: "recent-logs-heading", children: "Recent Logs" }),
          /* @__PURE__ */ jsxs("a", { href: "#logs", onClick: () => onNavigate("Realtime Logs"), children: [
            "View All ",
            /* @__PURE__ */ jsx(Arrow, {})
          ] })
        ] }),
        error ? /* @__PURE__ */ jsxs("div", { role: "alert", className: overview_default.emptyState, children: [
          /* @__PURE__ */ jsx("p", { children: "Unable to load recent logs. Please try again." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: overview_default.retry,
              onClick: () => {
                setError(false);
                setAttempt((value) => value + 1);
              },
              children: "Try again"
            }
          )
        ] }) : logs === null ? /* @__PURE__ */ jsx("div", { role: "status", "aria-label": "Loading recent logs", "aria-busy": "true", children: /* @__PURE__ */ jsx("div", { className: overview_default.logRows, "aria-hidden": "true", children: Array.from({ length: 10 }, (_, index) => /* @__PURE__ */ jsxs("div", { className: overview_default.logRow, children: [
          /* @__PURE__ */ jsx(SkeletonBar, { width: "42px" }),
          /* @__PURE__ */ jsx(SkeletonBar, { width: `${65 + index % 3 * 10}%` }),
          /* @__PURE__ */ jsx(SkeletonBar, { width: "38px" })
        ] }, index)) }) }) : logs.length === 0 ? /* @__PURE__ */ jsx("p", { className: overview_default.emptyState, children: "No logs in the last 24 hours." }) : /* @__PURE__ */ jsx("div", { className: overview_default.logRows, children: logs.map((log, index) => /* @__PURE__ */ jsxs("div", { className: overview_default.logRow, children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `${overview_default.level} ${log.level === "fatal" ? overview_default.error : overview_default[log.level] || ""}`,
              children: log.level.toUpperCase()
            }
          ),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsxs("span", { className: overview_default.logService, children: [
              "[",
              log.serviceName || "Unknown service",
              "]"
            ] }),
            " ",
            log.message
          ] }),
          /* @__PURE__ */ jsx("time", { dateTime: log.timestamp, title: log.timestamp, children: new Date(log.timestamp).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC"
          }) })
        ] }, `${log.id}:${index}`)) })
      ]
    }
  );
}
function Overview({
  onNavigate
}) {
  return /* @__PURE__ */ jsxs("div", { className: overview_default.overview, children: [
    /* @__PURE__ */ jsx(OverviewStats, { onNavigate }),
    /* @__PURE__ */ jsx(RecentLogs, { onNavigate })
  ] });
}

// src/dashboard/apm.tsx
import { useEffect as useEffect3, useMemo, useState as useState3 } from "react";

// src/dashboard/lib/dashboard-api-performance.ts
function fetchApiPerformance(cache) {
  const path = "/api/oneminutelogs/dashboard/api-performance?range=7d&limit=500&offset=0&sort=requests";
  return cache.remember(
    path,
    () => fetch(
      path,
      { cache: "no-store", signal: AbortSignal.timeout(2e4) }
    ).then(async (response) => {
      if (!response.ok)
        throw new Error("Unable to load API performance. Please try again.");
      const data = await response.json();
      if (!data?.summary || !Array.isArray(data.endpoints) || !Array.isArray(data.methods) || !data.pagination || !data.endpoints.every(
        (endpoint) => typeof endpoint.method === "string" && typeof endpoint.route === "string" && Array.isArray(endpoint.trend) && endpoint.trend.length === 12 && endpoint.trend.every(Number.isFinite)
      ))
        throw new Error("Invalid API performance response");
      return data;
    })
  );
}

// src/dashboard/lib/open-log-stream.ts
var reopenAt = /* @__PURE__ */ new Map();
var COOLDOWN_MS = 1e3;
function openLogStream(url2) {
  let source;
  let closed = false;
  const listeners = [];
  const stream = {
    onerror: null,
    addEventListener: ((...args) => {
      if (closed) return;
      if (source) source.addEventListener(...args);
      else listeners.push(args);
    }),
    close() {
      closed = true;
      clearTimeout(timer);
      source?.close();
      listeners.length = 0;
    }
  };
  let timer;
  const connect = () => {
    if (closed) return;
    const now = Date.now();
    const remaining = (reopenAt.get(url2) ?? 0) - now;
    if (remaining > 0) {
      timer = setTimeout(connect, remaining);
      return;
    }
    for (const [key, deadline] of reopenAt)
      if (deadline <= now) reopenAt.delete(key);
    if (reopenAt.size >= 128) reopenAt.delete(reopenAt.keys().next().value);
    reopenAt.set(url2, now + COOLDOWN_MS);
    source = new EventSource(url2);
    for (const args of listeners.splice(0)) source.addEventListener(...args);
    source.onerror = (event) => stream.onerror?.call(source, event);
  };
  timer = setTimeout(
    connect,
    Math.max(0, (reopenAt.get(url2) ?? 0) - Date.now())
  );
  return stream;
}

// src/dashboard/endpoint-logs.tsx
import { useEffect as useEffect2, useRef as useRef2, useState as useState2, useCallback } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var validLogs = (logs) => Array.isArray(logs) && logs.every(
  (log) => log && typeof log.id === "string" && typeof log.message === "string" && typeof log.serviceName === "string" && typeof log.level === "string" && Number.isFinite(Date.parse(log.timestamp))
);
var merge = (before, next) => [...new Map([...before, ...next].map((log) => [log.id, log])).values()].sort(
  (a, b) => b.timestamp.localeCompare(a.timestamp) || b.id.localeCompare(a.id)
);
function EndpointLogs({
  method,
  endpoint
}) {
  const [logs, setLogs] = useState2([]);
  const [state, setState] = useState2("loading");
  const [attempt, setAttempt] = useState2(0);
  const [cursor, setCursor] = useState2(null);
  const [loadingOlder, setLoadingOlder] = useState2(false);
  const [historyError, setHistoryError] = useState2(false);
  const [newCount, setNewCount] = useState2(0);
  const [retrySeconds, setRetrySeconds] = useState2(0);
  const [selectedLog, setSelectedLog] = useState2(null);
  const dialog = useRef2(null);
  useEffect2(() => {
    if (!selectedLog) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [selectedLog]);
  const retryAt = useRef2(0), starting = useRef2(false);
  const tail = useRef2(null), follow = useRef2(true);
  const pending = useRef2([]), known = useRef2(/* @__PURE__ */ new Set());
  const older = useRef2(null), paging = useRef2(false), currentCursor = useRef2(null);
  const generation = useRef2(0);
  const refresh = useCallback(() => {
    retryAt.current = 0;
    setRetrySeconds(0);
    starting.current = true;
    generation.current++;
    older.current?.abort();
    paging.current = false;
    setLogs([]);
    setState("loading");
    setCursor(null);
    currentCursor.current = null;
    setLoadingOlder(false);
    setHistoryError(false);
    setNewCount(0);
    pending.current = [];
    known.current.clear();
    follow.current = true;
    setAttempt((value) => value + 1);
  }, []);
  useEffect2(() => {
    const version = ++generation.current;
    const params = new URLSearchParams({ method, endpoint, range: "7d" });
    const source = openLogStream(
      `/api/oneminutelogs/dashboard/api-performance/logs/stream?${params}`
    );
    let active = true, terminal = false;
    const fail = () => {
      if (!active || terminal) return;
      terminal = true;
      source.close();
      starting.current = false;
      retryAt.current = Date.now() + 3e4;
      setRetrySeconds(30);
      setState("error");
    };
    let paused = false;
    let hiddenTimer;
    const visibilityChanged = () => {
      clearTimeout(hiddenTimer);
      if (document.visibilityState === "hidden") {
        if (paused) return;
        hiddenTimer = setTimeout(() => {
          if (!active || document.visibilityState !== "hidden") return;
          paused = true;
          terminal = true;
          source.close();
          generation.current++;
          older.current?.abort();
          paging.current = false;
          setLoadingOlder(false);
          setState("paused");
        }, 6e4);
      } else if (paused) {
        paused = false;
        refresh();
      }
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    visibilityChanged();
    source.addEventListener("history", (event) => {
      try {
        const page = JSON.parse(event.data);
        if (!validLogs(page.logs) || page.nextCursor !== null && typeof page.nextCursor !== "string")
          throw Error();
        if (!active || generation.current !== version) return;
        known.current = new Set(page.logs.map((log) => log.id));
        setLogs(merge([], page.logs));
        currentCursor.current = page.nextCursor;
        setCursor(page.nextCursor);
      } catch {
        fail();
      }
    });
    source.addEventListener("logs", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!validLogs(data.logs)) throw Error();
        if (!active || terminal || generation.current !== version) return;
        const fresh = data.logs.filter(
          (log) => !known.current.has(log.id)
        );
        fresh.forEach((log) => known.current.add(log.id));
        if (follow.current) setLogs((previous) => merge(previous, fresh));
        else {
          pending.current = merge(pending.current, fresh);
          if (pending.current.length > 1e3) {
            fail();
            return;
          }
          setNewCount(pending.current.length);
        }
      } catch {
        fail();
      }
    });
    source.addEventListener("ready", () => {
      if (active && !terminal) setState("live");
    });
    source.addEventListener("stream-error", fail);
    source.onerror = fail;
    return () => {
      active = false;
      terminal = true;
      generation.current = version + 1;
      clearTimeout(hiddenTimer);
      document.removeEventListener("visibilitychange", visibilityChanged);
      source.close();
      older.current?.abort();
    };
  }, [method, endpoint, attempt, refresh]);
  useEffect2(() => {
    if (follow.current && tail.current) tail.current.scrollTop = 0;
  }, [logs]);
  const coolingDown = retrySeconds > 0;
  useEffect2(() => {
    if (!coolingDown || state !== "error") return;
    const timer = setInterval(
      () => setRetrySeconds(
        Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1e3))
      ),
      1e3
    );
    return () => clearInterval(timer);
  }, [state, coolingDown]);
  const loadOlder = async () => {
    const next = currentCursor.current;
    if (!next || paging.current || document.visibilityState === "hidden")
      return;
    paging.current = true;
    setLoadingOlder(true);
    setHistoryError(false);
    const abort = new AbortController(), version = generation.current;
    older.current = abort;
    try {
      const query = new URLSearchParams({
        method,
        endpoint,
        range: "7d",
        cursor: next
      });
      const response = await fetch(
        `/api/oneminutelogs/dashboard/api-performance/logs?${query}`,
        { cache: "no-store", signal: abort.signal }
      );
      if (!response.ok) throw Error();
      const page = await response.json();
      if (!validLogs(page.logs) || page.nextCursor !== null && typeof page.nextCursor !== "string")
        throw Error();
      if (abort.signal.aborted || version !== generation.current) return;
      page.logs.forEach((log) => known.current.add(log.id));
      const loaded = new Set(page.logs.map((log) => log.id));
      pending.current = pending.current.filter((log) => !loaded.has(log.id));
      setNewCount(pending.current.length);
      setLogs((previous) => merge(previous, page.logs));
      currentCursor.current = page.nextCursor;
      setCursor(page.nextCursor);
    } catch {
      if (!abort.signal.aborted && version === generation.current)
        setHistoryError(true);
    } finally {
      if (version === generation.current) {
        paging.current = false;
        setLoadingOlder(false);
      }
    }
  };
  const retry = () => {
    if (starting.current || Date.now() < retryAt.current) return;
    refresh();
  };
  const showNew = () => {
    const updates = pending.current;
    pending.current = [];
    setLogs((previous) => merge(previous, updates));
    setNewCount(0);
    follow.current = true;
    if (tail.current) tail.current.scrollTop = 0;
  };
  return /* @__PURE__ */ jsxs2("section", { className: apm_default.panel, "aria-labelledby": "endpoint-logs-heading", children: [
    /* @__PURE__ */ jsxs2("div", { className: apm_default.panelHeading, children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("h2", { id: "endpoint-logs-heading", children: "Endpoint logs" }),
        /* @__PURE__ */ jsx2("p", { children: "Last 7 days \xB7 Newest first \xB7 UTC" })
      ] }),
      newCount > 0 && /* @__PURE__ */ jsxs2("button", { className: apm_default.newLogs, onClick: showNew, children: [
        newCount.toLocaleString(),
        " new logs \u2191"
      ] }),
      /* @__PURE__ */ jsx2("span", { role: "status", children: state === "live" ? "Live" : state === "loading" ? "Loading logs\u2026" : state === "paused" ? "Paused while tab is inactive" : "Disconnected" })
    ] }),
    state === "error" && /* @__PURE__ */ jsxs2("div", { className: apm_default.streamError, role: "alert", children: [
      "Live logs interrupted. Reconnect to refresh history.",
      /* @__PURE__ */ jsx2("button", { disabled: retrySeconds > 0, onClick: retry, children: retrySeconds > 0 ? `Reconnect in ${retrySeconds}s` : "Reconnect" })
    ] }),
    /* @__PURE__ */ jsxs2(
      "div",
      {
        className: apm_default.streamTail,
        ref: tail,
        tabIndex: 0,
        "aria-label": "Endpoint log tail",
        onScroll: () => {
          const el = tail.current;
          if (!el) return;
          follow.current = el.scrollTop < 24 && pending.current.length === 0;
          if (el.scrollHeight - el.clientHeight - el.scrollTop < 80 && !historyError)
            void loadOlder();
        },
        children: [
          /* @__PURE__ */ jsxs2("table", { className: apm_default.streamTable, children: [
            /* @__PURE__ */ jsx2("thead", { children: /* @__PURE__ */ jsxs2("tr", { children: [
              /* @__PURE__ */ jsx2("th", { children: "Time \xB7 UTC" }),
              /* @__PURE__ */ jsx2("th", { children: "Level" }),
              /* @__PURE__ */ jsx2("th", { children: "Service" }),
              /* @__PURE__ */ jsx2("th", { children: "Message" })
            ] }) }),
            /* @__PURE__ */ jsxs2("tbody", { children: [
              state === "loading" && logs.length === 0 && Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ jsx2("tr", { "aria-hidden": "true", children: [80, 50, 100, 250].map((width, column) => /* @__PURE__ */ jsx2("td", { children: /* @__PURE__ */ jsx2("span", { className: apm_default.skeleton, style: { width } }) }, column)) }, index)),
              logs.map((log) => /* @__PURE__ */ jsxs2(
                "tr",
                {
                  className: apm_default.inspectableRow,
                  onClick: () => setSelectedLog(log),
                  children: [
                    /* @__PURE__ */ jsx2("td", { children: /* @__PURE__ */ jsx2("time", { dateTime: log.timestamp, title: log.timestamp, children: new Date(log.timestamp).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZone: "UTC"
                    }) }) }),
                    /* @__PURE__ */ jsx2(
                      "td",
                      {
                        className: log.level === "error" || log.level === "fatal" ? apm_default.error : "",
                        children: log.level.toUpperCase()
                      }
                    ),
                    /* @__PURE__ */ jsx2("td", { children: log.serviceName || "\u2014" }),
                    /* @__PURE__ */ jsx2("td", { children: /* @__PURE__ */ jsx2(
                      "button",
                      {
                        className: apm_default.logMessageButton,
                        onClick: () => setSelectedLog(log),
                        "aria-label": `View log details: ${log.message}`,
                        children: log.message
                      }
                    ) })
                  ]
                },
                log.id
              ))
            ] })
          ] }),
          state === "live" && logs.length === 0 && /* @__PURE__ */ jsx2("div", { className: apm_default.empty, children: "No matching logs in the last 7 days. Waiting for new logs\u2026" }),
          loadingOlder && /* @__PURE__ */ jsx2("p", { className: apm_default.historyStatus, role: "status", children: "Loading older logs\u2026" }),
          historyError && /* @__PURE__ */ jsxs2("div", { className: apm_default.streamError, role: "alert", children: [
            "Unable to load older logs.",
            /* @__PURE__ */ jsx2("button", { onClick: () => void loadOlder(), children: "Try again" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs2("div", { className: apm_default.tableFooter, children: [
      /* @__PURE__ */ jsxs2("span", { children: [
        logs.length.toLocaleString(),
        " logs"
      ] }),
      /* @__PURE__ */ jsx2("span", { children: cursor ? "Scroll down to load 20 older logs" : state === "loading" ? "Loading history\u2026" : "End of this 7-day history" })
    ] }),
    selectedLog && /* @__PURE__ */ jsxs2(
      "dialog",
      {
        ref: dialog,
        className: apm_default.logDialog,
        "aria-labelledby": "endpoint-log-details-heading",
        onCancel: () => setSelectedLog(null),
        onClose: () => setSelectedLog(null),
        onClick: (event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
            setSelectedLog(null);
        },
        children: [
          /* @__PURE__ */ jsxs2("div", { className: apm_default.dialogHeading, children: [
            /* @__PURE__ */ jsxs2("div", { children: [
              /* @__PURE__ */ jsx2("h2", { id: "endpoint-log-details-heading", children: "Log details" }),
              /* @__PURE__ */ jsxs2("p", { children: [
                selectedLog.serviceName || "Unknown service",
                " \xB7",
                " ",
                selectedLog.level.toUpperCase()
              ] }),
              /* @__PURE__ */ jsxs2("p", { children: [
                selectedLog.timestamp,
                " \xB7 ",
                method,
                " ",
                endpoint
              ] })
            ] }),
            /* @__PURE__ */ jsx2(
              "button",
              {
                autoFocus: true,
                onClick: () => setSelectedLog(null),
                "aria-label": "Close log details",
                children: /* @__PURE__ */ jsx2(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.6",
                    strokeLinecap: "round",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx2("path", { d: "m6 6 12 12M18 6 6 18" })
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsx2(
            "pre",
            {
              className: apm_default.logJson,
              tabIndex: 0,
              "aria-label": "Full log JSON",
              children: /* @__PURE__ */ jsx2("code", { children: JSON.stringify(selectedLog, null, 2) })
            }
          )
        ]
      }
    )
  ] });
}

// src/dashboard/apm.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var number2 = (n) => new Intl.NumberFormat("en-US").format(n);
var rate = (n, total) => total ? `${(n / total * 100).toFixed(2)}%` : "\u2014";
var latency = (ms) => ms === null ? "\u2014" : ms >= 1e3 ? `${(ms / 1e3).toFixed(1)} s` : `${Math.round(ms)} ms`;
var identity = (e) => `${e.method}:${e.route}`;
function Arrow2({ back = false }) {
  return /* @__PURE__ */ jsx3(
    "svg",
    {
      width: "15",
      height: "15",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx3("path", { d: back ? "M19 12H5m6-6-6 6 6 6" : "m9 5 7 7-7 7" })
    }
  );
}
function Method({ value }) {
  return /* @__PURE__ */ jsx3("span", { className: `${apm_default.method} ${apm_default[value.toLowerCase()]}`, children: value });
}
function Sparkline({ values }) {
  const max = Math.max(1, ...values);
  return /* @__PURE__ */ jsx3("svg", { className: apm_default.sparkline, viewBox: "0 0 100 30", "aria-hidden": "true", children: /* @__PURE__ */ jsx3(
    "polyline",
    {
      points: values.map(
        (n, i) => `${i / (values.length - 1) * 100},${28 - n / max * 25}`
      ).join(" "),
      stroke: "#4599ff",
      strokeWidth: "1.5",
      fill: "none",
      strokeLinejoin: "round"
    }
  ) });
}
function Summary({ data }) {
  return /* @__PURE__ */ jsxs3(
    "section",
    {
      className: apm_default.summary,
      "aria-label": "API metrics for the last 7 days",
      children: [
        /* @__PURE__ */ jsxs3("article", { children: [
          /* @__PURE__ */ jsx3("span", { children: "Observed endpoints" }),
          /* @__PURE__ */ jsx3("strong", { children: number2(data.observedEndpoints) }),
          /* @__PURE__ */ jsx3("small", { children: "Seen in application telemetry" })
        ] }),
        /* @__PURE__ */ jsxs3("article", { children: [
          /* @__PURE__ */ jsx3("span", { children: "Requests" }),
          /* @__PURE__ */ jsx3("strong", { children: number2(data.requests) }),
          /* @__PURE__ */ jsx3("small", { children: "Last 7 days" })
        ] }),
        /* @__PURE__ */ jsxs3("article", { children: [
          /* @__PURE__ */ jsx3("span", { children: "Average response time" }),
          /* @__PURE__ */ jsx3("strong", { children: latency(data.averageMs) }),
          /* @__PURE__ */ jsx3("small", { children: "Measured on the server" })
        ] }),
        /* @__PURE__ */ jsxs3("article", { children: [
          /* @__PURE__ */ jsx3("span", { children: "Error rate" }),
          /* @__PURE__ */ jsx3("strong", { className: apm_default.error, children: data.errorRatePercent === null ? "\u2014" : `${data.errorRatePercent.toFixed(2)}%` }),
          /* @__PURE__ */ jsxs3("small", { children: [
            number2(data.failures),
            " failed requests"
          ] })
        ] })
      ]
    }
  );
}
function EndpointDetail({
  endpoint,
  onBack
}) {
  return /* @__PURE__ */ jsxs3("div", { className: apm_default.detail, children: [
    /* @__PURE__ */ jsxs3("button", { className: apm_default.back, onClick: onBack, children: [
      /* @__PURE__ */ jsx3(Arrow2, { back: true }),
      "All endpoints"
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: apm_default.detailHeading, children: [
      /* @__PURE__ */ jsxs3("div", { children: [
        /* @__PURE__ */ jsxs3("div", { className: apm_default.endpointTitle, children: [
          /* @__PURE__ */ jsx3(Method, { value: endpoint.method }),
          /* @__PURE__ */ jsx3("h2", { children: endpoint.route })
        ] }),
        /* @__PURE__ */ jsx3("p", { children: "Last 7 days \xB7 Endpoint metrics" })
      ] }),
      /* @__PURE__ */ jsx3("span", { className: apm_default.browserLabel, children: "Server-observed metrics" })
    ] }),
    /* @__PURE__ */ jsxs3(
      "section",
      {
        className: apm_default.summary,
        "aria-label": "Selected endpoint metrics",
        children: [
          /* @__PURE__ */ jsxs3("article", { children: [
            /* @__PURE__ */ jsx3("span", { children: "Requests" }),
            /* @__PURE__ */ jsx3("strong", { children: number2(endpoint.requests) }),
            /* @__PURE__ */ jsx3("small", { children: "Last 7 days" })
          ] }),
          /* @__PURE__ */ jsxs3("article", { children: [
            /* @__PURE__ */ jsx3("span", { children: "Average response time" }),
            /* @__PURE__ */ jsx3("strong", { children: latency(endpoint.averageMs) }),
            /* @__PURE__ */ jsx3("small", { children: "Measured on the server" })
          ] }),
          /* @__PURE__ */ jsxs3("article", { children: [
            /* @__PURE__ */ jsx3("span", { children: "Error rate" }),
            /* @__PURE__ */ jsx3("strong", { className: apm_default.error, children: rate(endpoint.failures, endpoint.requests) }),
            /* @__PURE__ */ jsxs3("small", { children: [
              number2(endpoint.failures),
              " failed requests"
            ] })
          ] }),
          /* @__PURE__ */ jsxs3("article", { children: [
            /* @__PURE__ */ jsx3("span", { children: "Maximum response time" }),
            /* @__PURE__ */ jsx3("strong", { children: latency(endpoint.maximumMs) }),
            /* @__PURE__ */ jsx3("small", { children: "Measured on the server" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx3(EndpointLogs, { method: endpoint.method, endpoint: endpoint.route })
  ] });
}
function Apm({
  openEndpoint
}) {
  const cache = useDashboardCache();
  const [selected, setSelected] = useState3(null);
  const [query, setQuery] = useState3("");
  const [method, setMethod] = useState3("All methods");
  const [sort, setSort] = useState3("requests");
  const [offset, setOffset] = useState3(0);
  const [attempt, setAttempt] = useState3(0);
  const [result, setResult] = useState3(null);
  const [failure, setFailure] = useState3(null);
  useEffect3(() => {
    let active = true;
    fetchApiPerformance(cache).then((data2) => {
      if (active) setResult(data2);
    }).catch(() => {
      if (active) setFailure("Unable to load API performance. Please try again.");
    });
    return () => {
      active = false;
    };
  }, [cache, attempt]);
  const data = result;
  const error = failure && !data ? failure : null;
  const loading = !data && !error;
  const matchingEndpoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const value = data?.endpoints.filter(
      (endpoint) => (method === "All methods" || endpoint.method === method) && (!normalizedQuery || `${endpoint.method} ${endpoint.route}`.toLowerCase().includes(normalizedQuery))
    ) ?? [];
    const comparison = {
      requests: (endpoint) => endpoint.requests,
      latency: (endpoint) => endpoint.averageMs ?? -1,
      errors: (endpoint) => endpoint.errorRatePercent ?? -1,
      failures: (endpoint) => endpoint.failures
    }[sort] ?? ((endpoint) => endpoint.requests);
    return [...value].sort(
      (a, b) => comparison(b) - comparison(a) || a.method.localeCompare(b.method) || a.route.localeCompare(b.route)
    );
  }, [data, method, query, sort]);
  const pageSize = 25;
  const filtered = matchingEndpoints.slice(offset, offset + pageSize);
  const summary = data?.summary;
  useEffect3(() => {
    if (!openEndpoint || !data) return;
    const endpoint = data.endpoints.find(
      (item) => item.method === openEndpoint.method && item.route === openEndpoint.route
    );
    if (endpoint) setSelected(endpoint);
  }, [data, openEndpoint]);
  if (selected)
    return /* @__PURE__ */ jsx3(
      EndpointDetail,
      {
        endpoint: selected,
        onBack: () => setSelected(null)
      },
      identity(selected)
    );
  return /* @__PURE__ */ jsxs3("div", { className: apm_default.apm, children: [
    summary ? /* @__PURE__ */ jsx3(Summary, { data: summary }) : /* @__PURE__ */ jsx3(
      "section",
      {
        className: apm_default.summary,
        role: "status",
        "aria-label": "Loading API metrics",
        "aria-busy": "true",
        children: [0, 1, 2, 3].map((index) => /* @__PURE__ */ jsxs3("article", { "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx3("span", { className: apm_default.skeleton, style: { width: "60%" } }),
          /* @__PURE__ */ jsx3("strong", { children: /* @__PURE__ */ jsx3(
            "span",
            {
              className: apm_default.skeleton,
              style: { width: "90px", height: "30px" }
            }
          ) }),
          /* @__PURE__ */ jsx3("small", { children: /* @__PURE__ */ jsx3("span", { className: apm_default.skeleton, style: { width: "70%" } }) })
        ] }, index))
      }
    ),
    /* @__PURE__ */ jsxs3("section", { className: apm_default.panel, "aria-labelledby": "api-endpoints-heading", children: [
      /* @__PURE__ */ jsxs3("div", { className: apm_default.panelHeading, children: [
        /* @__PURE__ */ jsxs3("div", { children: [
          /* @__PURE__ */ jsx3("h2", { id: "api-endpoints-heading", children: "API endpoints" }),
          /* @__PURE__ */ jsx3("p", { children: "Endpoints observed in server telemetry. Last 7 days." })
        ] }),
        /* @__PURE__ */ jsx3("span", { children: summary ? `${number2(summary.observedEndpoints)} endpoints` : "Loading\u2026" })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: apm_default.toolbar, children: [
        /* @__PURE__ */ jsxs3("label", { className: apm_default.search, children: [
          /* @__PURE__ */ jsxs3(
            "svg",
            {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.5",
              "aria-hidden": "true",
              children: [
                /* @__PURE__ */ jsx3("circle", { cx: "10.5", cy: "10.5", r: "6.5" }),
                /* @__PURE__ */ jsx3("path", { d: "m16 16 5 5" })
              ]
            }
          ),
          /* @__PURE__ */ jsx3("span", { className: apm_default.srOnly, children: "Search API endpoints" }),
          /* @__PURE__ */ jsx3(
            "input",
            {
              placeholder: "Search endpoints\u2026",
              value: query,
              onChange: (e) => {
                setQuery(e.target.value);
                setOffset(0);
              }
            }
          )
        ] }),
        /* @__PURE__ */ jsxs3("label", { className: apm_default.selectLabel, children: [
          /* @__PURE__ */ jsx3("span", { className: apm_default.srOnly, children: "Filter HTTP method" }),
          /* @__PURE__ */ jsxs3(
            "select",
            {
              value: method,
              onChange: (e) => {
                setMethod(e.target.value);
                setOffset(0);
              },
              children: [
                /* @__PURE__ */ jsx3("option", { children: "All methods" }),
                (data?.methods ?? []).map((name) => /* @__PURE__ */ jsx3("option", { children: name }, name))
              ]
            }
          )
        ] }),
        !!data?.endpoints.length && /* @__PURE__ */ jsxs3("label", { className: `${apm_default.selectLabel} ${apm_default.sort}`, children: [
          /* @__PURE__ */ jsx3("span", { className: apm_default.srOnly, children: "Sort endpoints" }),
          /* @__PURE__ */ jsxs3(
            "select",
            {
              disabled: loading || !!error,
              value: sort,
              onChange: (e) => {
                setSort(e.target.value);
                setOffset(0);
              },
              children: [
                /* @__PURE__ */ jsx3("option", { value: "requests", children: "Most requests" }),
                /* @__PURE__ */ jsx3("option", { value: "latency", children: "Slowest response" }),
                /* @__PURE__ */ jsx3("option", { value: "errors", children: "Highest error rate" }),
                /* @__PURE__ */ jsx3("option", { value: "failures", children: "Most failed requests" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx3("div", { className: apm_default.tableScroll, "aria-busy": loading, children: /* @__PURE__ */ jsxs3("table", { className: apm_default.endpointTable, children: [
        /* @__PURE__ */ jsx3("thead", { children: /* @__PURE__ */ jsxs3("tr", { children: [
          /* @__PURE__ */ jsx3("th", { scope: "col", children: "Endpoint" }),
          /* @__PURE__ */ jsx3("th", { scope: "col", children: "Requests" }),
          /* @__PURE__ */ jsx3("th", { scope: "col", children: "Avg. response" }),
          /* @__PURE__ */ jsx3("th", { scope: "col", children: "Error rate" }),
          /* @__PURE__ */ jsx3("th", { scope: "col", children: "Failed requests" }),
          /* @__PURE__ */ jsx3("th", { scope: "col", children: "Activity" }),
          /* @__PURE__ */ jsx3("th", { scope: "col", children: /* @__PURE__ */ jsx3("span", { className: apm_default.srOnly, children: "Open endpoint" }) })
        ] }) }),
        /* @__PURE__ */ jsxs3("tbody", { children: [
          loading && Array.from({ length: 9 }, (_, index) => /* @__PURE__ */ jsx3("tr", { "aria-hidden": "true", children: Array.from({ length: 7 }, (_2, column) => /* @__PURE__ */ jsx3("td", { children: /* @__PURE__ */ jsx3(
            "span",
            {
              className: apm_default.skeleton,
              style: { width: column === 0 ? "75%" : "64px" }
            }
          ) }, column)) }, `skeleton:${index}`)),
          filtered.map((endpoint) => /* @__PURE__ */ jsxs3("tr", { children: [
            /* @__PURE__ */ jsx3("td", { children: /* @__PURE__ */ jsxs3(
              "button",
              {
                className: apm_default.endpointLink,
                onClick: () => setSelected(endpoint),
                "aria-label": `Open ${endpoint.method} ${endpoint.route}`,
                children: [
                  /* @__PURE__ */ jsx3(Method, { value: endpoint.method }),
                  /* @__PURE__ */ jsx3("code", { children: endpoint.route })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx3("td", { className: apm_default.numeric, children: number2(endpoint.requests) }),
            /* @__PURE__ */ jsx3("td", { className: apm_default.numeric, children: latency(endpoint.averageMs) }),
            /* @__PURE__ */ jsx3(
              "td",
              {
                className: `${apm_default.numeric} ${endpoint.failures / endpoint.requests >= 0.05 ? apm_default.error : ""}`,
                children: rate(endpoint.failures, endpoint.requests)
              }
            ),
            /* @__PURE__ */ jsx3(
              "td",
              {
                className: `${apm_default.numeric} ${endpoint.failures > 0 ? apm_default.error : ""}`,
                children: number2(endpoint.failures)
              }
            ),
            /* @__PURE__ */ jsx3("td", { children: /* @__PURE__ */ jsx3(Sparkline, { values: endpoint.trend }) }),
            /* @__PURE__ */ jsx3("td", { children: /* @__PURE__ */ jsx3(
              "button",
              {
                className: apm_default.openEndpoint,
                onClick: () => setSelected(endpoint),
                "aria-label": `View ${endpoint.method} ${endpoint.route} logs`,
                children: /* @__PURE__ */ jsx3(Arrow2, {})
              }
            ) })
          ] }, identity(endpoint)))
        ] })
      ] }) }),
      !loading && !error && filtered.length === 0 && /* @__PURE__ */ jsx3("div", { className: apm_default.empty, children: summary?.observedEndpoints === 0 ? "No API request observations in the last 7 days." : "No endpoints match your filters." }),
      error && /* @__PURE__ */ jsxs3("div", { className: apm_default.empty, role: "alert", children: [
        error,
        /* @__PURE__ */ jsx3(
          "button",
          {
            onClick: () => {
              setFailure(null);
              setAttempt((value) => value + 1);
            },
            children: "Try again"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: apm_default.tableFooter, children: [
        /* @__PURE__ */ jsx3("span", { children: data ? `Showing ${filtered.length ? offset + 1 : 0}\u2013${offset + filtered.length} of ${matchingEndpoints.length} endpoints` : loading ? "Loading endpoints\u2026" : "Endpoints unavailable" }),
        /* @__PURE__ */ jsxs3("div", { className: apm_default.pagination, children: [
          /* @__PURE__ */ jsx3(
            "button",
            {
              disabled: loading || offset === 0,
              onClick: () => setOffset((value) => Math.max(0, value - 25)),
              children: "Previous"
            }
          ),
          /* @__PURE__ */ jsx3(
            "button",
            {
              disabled: offset + pageSize >= matchingEndpoints.length || loading,
              onClick: () => setOffset((value) => value + pageSize),
              children: "Next"
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// src/dashboard/rum.tsx
import { useEffect as useEffect4, useState as useState4 } from "react";

// src/dashboard/rum.module.css
var rum_default = {
  rum: "rum_rum",
  periodBar: "rum_periodBar",
  note: "rum_note",
  apiLink: "rum_apiLink",
  networkEmpty: "rum_networkEmpty",
  browserIssues: "rum_browserIssues",
  issues: "rum_issues",
  issue: "rum_issue",
  issueType: "rum_issueType",
  issueTitle: "rum_issueTitle",
  issueMetric: "rum_issueMetric",
  expand: "rum_expand",
  issueEvidence: "rum_issueEvidence",
  eventEvidence: "rum_eventEvidence",
  evidence: "rum_evidence",
  facts: "rum_facts",
  stack: "rum_stack",
  json: "rum_json"
};

// src/dashboard/rum.tsx
import { Fragment as Fragment2, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var time = (timestamp) => new Date(timestamp).toLocaleTimeString("en-GB", {
  timeZone: "UTC",
  hour12: false
});
function title(event) {
  return event.type === "javascript_error" ? `${event.name}: ${event.message}` : event.reason === "transport_failure" ? "Network connection failed" : event.reason === "slow_response" ? `Slow response \xB7 HTTP ${event.status} \xB7 ${event.method} ${event.endpoint}` : `HTTP ${event.status} \xB7 ${event.method} ${event.endpoint}`;
}
function Evidence({ event }) {
  return /* @__PURE__ */ jsxs4("div", { className: rum_default.evidence, children: [
    /* @__PURE__ */ jsxs4("dl", { className: rum_default.facts, children: [
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4("dt", { children: "Session ID" }),
        /* @__PURE__ */ jsx4("dd", { children: event.sessionId })
      ] }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4("dt", { children: "Page context" }),
        /* @__PURE__ */ jsx4("dd", { children: event.route })
      ] }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4("dt", { children: "Last observed \xB7 UTC" }),
        /* @__PURE__ */ jsx4("dd", { children: time(event.lastSeenAt) })
      ] }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx4("dt", { children: "Recorded occurrences" }),
        /* @__PURE__ */ jsx4("dd", { children: event.occurrences ?? "Not applicable" })
      ] }),
      event.type !== "javascript_error" && /* @__PURE__ */ jsxs4(Fragment2, { children: [
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4("dt", { children: "Endpoint" }),
          /* @__PURE__ */ jsxs4("dd", { children: [
            event.method,
            " ",
            event.endpoint
          ] })
        ] }),
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4("dt", { children: "Maximum latency" }),
          /* @__PURE__ */ jsxs4("dd", { children: [
            event.maxLatencyMs,
            " ms"
          ] })
        ] })
      ] })
    ] }),
    event.frames && /* @__PURE__ */ jsxs4("div", { className: rum_default.stack, children: [
      /* @__PURE__ */ jsx4("strong", { children: "Recorded stack frames" }),
      event.frames.length ? event.frames.map((frame, index) => /* @__PURE__ */ jsxs4("code", { children: [
        frame.file,
        ":",
        frame.line,
        ":",
        frame.column
      ] }, index)) : /* @__PURE__ */ jsx4("p", { children: "No stack frames captured." })
    ] }),
    /* @__PURE__ */ jsxs4("details", { className: rum_default.json, children: [
      /* @__PURE__ */ jsx4("summary", { children: "Original event JSON" }),
      /* @__PURE__ */ jsx4("pre", { tabIndex: 0, children: JSON.stringify(event, null, 2) })
    ] })
  ] });
}
function Rum({
  isActive = true,
  onOpenApiEndpoint
}) {
  const cache = useDashboardCache();
  const [period, setPeriod] = useState4("7d");
  const [hasSessions, setHasSessions] = useState4(false);
  const [kind, setKind] = useState4("All issues");
  const [query, setQuery] = useState4("");
  const [networkOffset, setNetworkOffset] = useState4(0);
  const [data, setData] = useState4(null);
  const [loading, setLoading] = useState4(true);
  const [failed, setFailed] = useState4(false);
  useEffect4(() => {
    if (!isActive) return;
    let active = true;
    const url2 = `/api/oneminutelogs/dashboard/browser-health?range=${period}&networkOffset=${networkOffset}`;
    cache.remember(url2, async () => {
      const response = await fetch(url2, { cache: "no-store", signal: AbortSignal.timeout(2e4) });
      if (!response.ok) throw Error("Unable to load browser health");
      const next = await response.json();
      if (!next.summary || !next.network || !Array.isArray(next.network.endpoints) || !Array.isArray(next.issues) || !Array.isArray(next.recentErrors)) throw Error("Invalid browser health response");
      return next;
    }).then((next) => {
      if (!active) return;
      setData(next);
      if (period === "7d") setHasSessions((next.summary.observedSessions ?? next.summary.activeSessions) > 0);
      setFailed(false);
    }).catch(() => {
      if (active) setFailed(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [period, networkOffset, isActive, cache]);
  const issues = (data?.issues ?? []).map((issue) => ({ ...issue, example: issue.evidence[0] })).filter(
    ({ evidence, example }) => example && (kind === "All issues" || (kind === "JavaScript" ? example.type === "javascript_error" : example.type === "network_error")) && `${title(example)} ${evidence.map((event) => event.route).join(" ")}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  const metric = (value) => loading ? /* @__PURE__ */ jsx4("span", { className: apm_default.skeleton, style: { width: 80, height: 32 } }) : failed ? "\u2014" : (value ?? 0).toLocaleString();
  return /* @__PURE__ */ jsxs4("div", { className: `${apm_default.apm} ${rum_default.rum}`, children: [
    /* @__PURE__ */ jsxs4("div", { className: rum_default.periodBar, children: [
      /* @__PURE__ */ jsx4("span", { children: loading ? "Loading browser health\u2026" : failed ? "Unable to load browser health" : `Updated ${new Date(data.window.to).toLocaleString("en-GB", { timeZone: "UTC" })} UTC` }),
      hasSessions && /* @__PURE__ */ jsxs4("label", { className: apm_default.selectLabel, children: [
        /* @__PURE__ */ jsx4("span", { className: apm_default.srOnly, children: "Observation period" }),
        /* @__PURE__ */ jsxs4(
          "select",
          {
            value: period,
            onChange: (event) => {
              setLoading(true);
              setFailed(false);
              setData(null);
              setNetworkOffset(0);
              setPeriod(event.target.value);
            },
            children: [
              /* @__PURE__ */ jsx4("option", { value: "7d", children: "Last 7 days" }),
              /* @__PURE__ */ jsx4("option", { value: "24h", children: "Last 24 hours" }),
              /* @__PURE__ */ jsx4("option", { value: "1h", children: "Last hour" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: apm_default.summary, "aria-label": "Browser health metrics", children: [
      /* @__PURE__ */ jsxs4("article", { children: [
        /* @__PURE__ */ jsx4("span", { children: "Active Sessions" }),
        /* @__PURE__ */ jsx4("strong", { children: metric(data?.summary.activeSessions) }),
        /* @__PURE__ */ jsx4("small", { children: "Observed activity \xB7 Last 5 minutes" })
      ] }),
      /* @__PURE__ */ jsxs4("article", { children: [
        /* @__PURE__ */ jsx4("span", { children: "JavaScript Errors" }),
        /* @__PURE__ */ jsx4("strong", { className: apm_default.error, children: metric(data?.summary.javascriptErrors) }),
        /* @__PURE__ */ jsxs4("small", { children: [
          "Recorded occurrences \xB7",
          " ",
          period === "7d" ? "Last 7 days" : period === "24h" ? "Last 24 hours" : "Last hour"
        ] })
      ] }),
      /* @__PURE__ */ jsxs4("article", { children: [
        /* @__PURE__ */ jsx4("span", { children: "Affected Sessions" }),
        /* @__PURE__ */ jsx4("strong", { children: metric(data?.summary.affectedSessions) }),
        /* @__PURE__ */ jsx4("small", { children: "With JS errors or network failures" })
      ] }),
      /* @__PURE__ */ jsxs4("article", { children: [
        /* @__PURE__ */ jsx4("span", { children: "Network Failures" }),
        /* @__PURE__ */ jsx4("strong", { className: apm_default.error, children: metric(data?.summary.networkFailures) }),
        /* @__PURE__ */ jsx4("small", { children: "HTTP 5xx and transport failures" })
      ] })
    ] }),
    failed && /* @__PURE__ */ jsx4("p", { className: rum_default.note, role: "alert", children: "Browser health could not be loaded. Try again after reopening this page." }),
    /* @__PURE__ */ jsx4("p", { className: rum_default.note, children: "Activity reflects received RUM health events, not every open browser. Session IDs are anonymous correlation identifiers. Counts use recorded occurrences; network summaries are not counted again." }),
    /* @__PURE__ */ jsxs4("section", { className: apm_default.panel, "aria-labelledby": "browser-network-heading", children: [
      /* @__PURE__ */ jsxs4("div", { className: apm_default.panelHeading, children: [
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4("h2", { id: "browser-network-heading", children: "Browser HTTP Requests" }),
          /* @__PURE__ */ jsx4("p", { children: "Request volume, browser-measured latency, and network failures." })
        ] }),
        /* @__PURE__ */ jsx4("span", { children: loading ? "Loading\u2026" : `${data?.summary.browserRequests.toLocaleString() ?? 0} requests \xB7 ${data?.summary.browserAverageMs === null ? "\u2014" : `${Math.round(data?.summary.browserAverageMs ?? 0)} ms`} browser average` })
      ] }),
      /* @__PURE__ */ jsx4("div", { className: apm_default.tableScroll, children: /* @__PURE__ */ jsxs4("table", { className: apm_default.endpointTable, children: [
        /* @__PURE__ */ jsx4("thead", { children: /* @__PURE__ */ jsxs4("tr", { children: [
          /* @__PURE__ */ jsx4("th", { children: "Endpoint" }),
          /* @__PURE__ */ jsx4("th", { children: "Requests" }),
          /* @__PURE__ */ jsx4("th", { children: "Browser latency" }),
          /* @__PURE__ */ jsx4("th", { children: "Network failures" }),
          /* @__PURE__ */ jsx4("th", { children: /* @__PURE__ */ jsx4("span", { className: apm_default.srOnly, children: "API Performance" }) })
        ] }) }),
        /* @__PURE__ */ jsx4("tbody", { children: (data?.network.endpoints ?? []).map((endpoint) => /* @__PURE__ */ jsxs4("tr", { children: [
          /* @__PURE__ */ jsxs4("td", { children: [
            /* @__PURE__ */ jsx4("span", { className: `${apm_default.method} ${apm_default[endpoint.method.toLowerCase()]}`, children: endpoint.method }),
            " ",
            /* @__PURE__ */ jsx4("code", { children: endpoint.endpoint })
          ] }),
          /* @__PURE__ */ jsx4("td", { className: apm_default.numeric, children: endpoint.requests.toLocaleString() }),
          /* @__PURE__ */ jsx4("td", { className: apm_default.numeric, children: endpoint.averageMs === null ? "\u2014" : `${Math.round(endpoint.averageMs)} ms` }),
          /* @__PURE__ */ jsx4("td", { className: `${apm_default.numeric} ${endpoint.failures ? apm_default.error : ""}`, children: endpoint.failures.toLocaleString() }),
          /* @__PURE__ */ jsx4("td", { children: endpoint.apiPerformanceMatch && /* @__PURE__ */ jsx4("button", { className: rum_default.apiLink, onClick: () => onOpenApiEndpoint?.(endpoint), children: "View server metrics" }) })
        ] }, `${endpoint.method}:${endpoint.endpoint}`)) })
      ] }) }),
      !loading && !failed && !data?.network.endpoints.length && /* @__PURE__ */ jsx4("p", { className: rum_default.networkEmpty, children: "No browser HTTP requests recorded in this period." }),
      /* @__PURE__ */ jsxs4("div", { className: apm_default.tableFooter, children: [
        /* @__PURE__ */ jsx4("span", { children: data ? `Showing ${data.network.endpoints.length ? data.network.pagination.offset + 1 : 0}\u2013${data.network.pagination.offset + data.network.endpoints.length} of ${data.network.pagination.total} endpoints` : "Loading endpoints\u2026" }),
        /* @__PURE__ */ jsxs4("div", { className: apm_default.pagination, "aria-label": "Browser request pages", children: [
          /* @__PURE__ */ jsx4(
            "button",
            {
              "aria-label": "Previous browser requests",
              disabled: loading || networkOffset === 0,
              onClick: () => {
                setLoading(true);
                setFailed(false);
                setNetworkOffset((value) => Math.max(0, value - 10));
              },
              children: "\u2190"
            }
          ),
          /* @__PURE__ */ jsx4(
            "button",
            {
              "aria-label": "Next browser requests",
              disabled: loading || !data?.network.pagination.hasMore,
              onClick: () => {
                setLoading(true);
                setFailed(false);
                setNetworkOffset((value) => value + 10);
              },
              children: "\u2192"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("section", { className: `${apm_default.panel} ${rum_default.browserIssues}`, "aria-labelledby": "browser-issues-heading", children: [
      /* @__PURE__ */ jsxs4("div", { className: apm_default.panelHeading, children: [
        /* @__PURE__ */ jsxs4("div", { children: [
          /* @__PURE__ */ jsx4("h2", { id: "browser-issues-heading", children: "Browser Issues" }),
          /* @__PURE__ */ jsx4("p", { children: "Diagnostic groups from recorded error fingerprints and network signatures." })
        ] }),
        /* @__PURE__ */ jsx4("span", { children: loading ? "Loading\u2026" : `${issues.length}${data?.hasMoreIssues ? "+" : ""} issues` })
      ] }),
      (data?.issues.length ?? 0) > 0 && /* @__PURE__ */ jsxs4("div", { className: apm_default.toolbar, children: [
        /* @__PURE__ */ jsxs4("label", { className: apm_default.search, children: [
          /* @__PURE__ */ jsx4("span", { className: apm_default.srOnly, children: "Search issues or page context" }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              placeholder: "Search issues or page context\u2026",
              value: query,
              onChange: (event) => setQuery(event.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx4("div", { className: apm_default.sourceTabs, role: "group", "aria-label": "Issue type", children: ["All issues", "JavaScript", "Network"].map((value) => /* @__PURE__ */ jsx4(
          "button",
          {
            "aria-pressed": kind === value,
            className: kind === value ? apm_default.selectedTab : "",
            onClick: () => setKind(value),
            children: value
          },
          value
        )) })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: rum_default.issues, children: [
        !loading && !failed && issues.length === 0 && /* @__PURE__ */ jsx4("p", { className: rum_default.note, children: (data?.issues.length ?? 0) > 0 ? "No recorded issues match these filters." : `No browser issues recorded in ${period === "7d" ? "the last 7 days" : period === "24h" ? "the last 24 hours" : "the last hour"}.` }),
        loading && Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsx4(
          "div",
          {
            className: rum_default.issue,
            "aria-hidden": "true",
            style: { height: 88, marginTop: 10, padding: 20 },
            children: /* @__PURE__ */ jsx4("span", { className: apm_default.skeleton, style: { width: "60%" } })
          },
          i
        )),
        data?.hasMoreIssues && /* @__PURE__ */ jsx4("p", { className: rum_default.note, children: "Showing the 50 most frequent issue groups in this period." }),
        issues.map(
          ({ key, evidence, example, occurrences, sessions, lastSeenAt }) => /* @__PURE__ */ jsxs4("details", { className: rum_default.issue, children: [
            /* @__PURE__ */ jsxs4("summary", { children: [
              /* @__PURE__ */ jsx4("span", { className: rum_default.issueType, children: example.type === "javascript_error" ? "JS" : "HTTP" }),
              /* @__PURE__ */ jsxs4("span", { className: rum_default.issueTitle, children: [
                /* @__PURE__ */ jsx4("strong", { children: title(example) }),
                /* @__PURE__ */ jsxs4("small", { children: [
                  example.environment,
                  " \xB7",
                  " ",
                  Array.from(
                    new Set(evidence.map((event) => event.route))
                  ).join(" \xB7 ")
                ] })
              ] }),
              /* @__PURE__ */ jsxs4("span", { className: rum_default.issueMetric, children: [
                /* @__PURE__ */ jsx4("strong", { children: occurrences.toLocaleString() }),
                /* @__PURE__ */ jsx4("small", { children: "occurrences" })
              ] }),
              /* @__PURE__ */ jsxs4("span", { className: rum_default.issueMetric, children: [
                /* @__PURE__ */ jsx4("strong", { children: sessions.toLocaleString() }),
                /* @__PURE__ */ jsx4("small", { children: "sessions" })
              ] }),
              /* @__PURE__ */ jsxs4("span", { className: rum_default.issueMetric, children: [
                /* @__PURE__ */ jsx4("strong", { children: time(lastSeenAt) }),
                /* @__PURE__ */ jsx4("small", { children: "last observed \xB7 UTC" })
              ] }),
              /* @__PURE__ */ jsx4("span", { className: rum_default.expand, children: "+" })
            ] }),
            /* @__PURE__ */ jsxs4("div", { className: rum_default.issueEvidence, children: [
              /* @__PURE__ */ jsx4("p", { children: example.type === "javascript_error" ? "Grouped by recorded diagnostic fingerprint." : "Grouped by method, endpoint, failure reason and status. This signature does not establish a shared root cause." }),
              /* @__PURE__ */ jsxs4("p", { children: [
                "Latest ",
                evidence.length,
                " diagnostic records for this group."
              ] }),
              evidence.map((event) => /* @__PURE__ */ jsxs4(
                "details",
                {
                  className: rum_default.eventEvidence,
                  children: [
                    /* @__PURE__ */ jsxs4("summary", { children: [
                      time(event.lastSeenAt),
                      " UTC \xB7 ",
                      event.sessionId,
                      " \xB7",
                      " ",
                      event.occurrences,
                      " occurrences"
                    ] }),
                    /* @__PURE__ */ jsx4(Evidence, { event })
                  ]
                },
                event.eventId
              ))
            ] })
          ] }, key)
        )
      ] })
    ] })
  ] });
}

// src/dashboard/lib/incident-requests.ts
function read(cache, query, detail) {
  const normalized = new URLSearchParams(query);
  if (!detail) normalized.set("limit", normalized.get("limit") || "25");
  normalized.sort();
  const key = `/api/oneminutelogs/dashboard/incidents?${normalized}`;
  return cache.remember(key, async () => {
    const response = await fetch(key, { cache: "no-store", signal: AbortSignal.timeout(2e4) });
    if (detail && response.status === 404) return null;
    if (!response.ok) throw Error("Unable to load incidents");
    const value = await response.json();
    if (!value || (detail ? typeof value.conditionKey !== "string" : !Array.isArray(value.incidents) || !value.summary)) throw Error("Invalid incidents response");
    return value;
  });
}
var fetchIncidentPage = (cache, query) => read(cache, query, false);
var fetchIncident = (cache, key) => read(cache, new URLSearchParams({ conditionKey: key }), true);

// src/dashboard/incidents.tsx
import { useEffect as useEffect7, useRef as useRef5, useState as useState7 } from "react";

// src/dashboard/incident-logs.tsx
import { useEffect as useEffect6, useRef as useRef4, useState as useState6 } from "react";

// src/dashboard/incidents.module.css
var incidents_default = {
  incidents: "incidents_incidents",
  snapshot: "incidents_snapshot",
  capitalize: "incidents_capitalize",
  filters: "incidents_filters",
  workspace: "incidents_workspace",
  inbox: "incidents_inbox",
  incidentCard: "incidents_incidentCard",
  report: "incidents_report",
  selected: "incidents_selected",
  cardTop: "incidents_cardTop",
  cardBottom: "incidents_cardBottom",
  cardScope: "incidents_cardScope",
  cardMetric: "incidents_cardMetric",
  badge: "incidents_badge",
  active: "incidents_active",
  suspected: "incidents_suspected",
  recovering: "incidents_recovering",
  resolved: "incidents_resolved",
  reportHeading: "incidents_reportHeading",
  reportBadges: "incidents_reportBadges",
  summaryText: "incidents_summaryText",
  comparison: "incidents_comparison",
  quality: "incidents_quality",
  facts: "incidents_facts",
  lifecycle: "incidents_lifecycle",
  evidence: "incidents_evidence",
  relatedLogs: "incidents_relatedLogs",
  logContext: "incidents_logContext",
  logControls: "incidents_logControls",
  follow: "incidents_follow",
  relatedTail: "incidents_relatedTail",
  relatedLog: "incidents_relatedLog",
  relatedMessage: "incidents_relatedMessage",
  inspectJson: "incidents_inspectJson",
  logFootnote: "incidents_logFootnote",
  stickyHeader: "incidents_stickyHeader"
};

// src/dashboard/use-realtime-logs.ts
import {
  useEffect as useEffect5,
  useCallback as useCallback2,
  useLayoutEffect,
  useRef as useRef3,
  useState as useState5
} from "react";

// src/dashboard/lib/realtime-logs.ts
var logGroups = {
  database: "Database",
  api_network: "API & Network",
  authentication: "Authentication",
  application: "Application",
  other: "Other"
};
var validRealtimeLogs = (logs) => Array.isArray(logs) && logs.every(
  (log) => log && typeof log.id === "string" && typeof log.message === "string" && typeof log.serviceName === "string" && ["trace", "debug", "info", "warn", "error", "fatal"].includes(
    log.level
  ) && Number.isFinite(Date.parse(log.timestamp)) && log.attributes && typeof log.attributes === "object"
);
var mergeRealtimeLogs = (previous, next) => [
  ...new Map([...previous, ...next].map((log) => [log.id, log])).values()
].sort(
  (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id.localeCompare(b.id)
);
function presentLog(log) {
  const grouping = log.grouping;
  const duration = log.attributes["perf.duration_ms"] ?? log.attributes["duration_ms"] ?? log.attributes["duration.ms"] ?? log.attributes["http.duration_ms"] ?? log.attributes["db.duration_ms"] ?? log.attributes["durationMs"] ?? log.attributes["maxLatencyMs"];
  const ms = typeof duration === "number" || typeof duration === "string" && duration.trim() !== "" ? Number(duration) : NaN;
  return {
    ...log,
    record: log,
    severity: log.level.toUpperCase(),
    service: log.source === "browser" ? "Browser" : log.serviceName,
    body: log.message,
    parentGroup: logGroups[grouping?.parentGroup] ?? "Other",
    subgroupId: grouping?.subgroupId ?? "",
    subgroupName: grouping?.subgroupName ?? "",
    classification: grouping?.classification ?? "unclassified",
    durationMs: Number.isFinite(ms) && ms >= 0 ? ms : void 0
  };
}

// src/dashboard/use-realtime-logs.ts
function useRealtimeLogs(basePath = "/api/oneminutelogs/dashboard/realtime-logs", range = "7d", isActive = true) {
  const tail = useRef3(null);
  const attachTail = useCallback2((element) => {
    tail.current = element;
  }, []);
  const [logs, setLogs] = useState5([]), [state, setState] = useState5(
    "loading"
  );
  const [cursor, setCursor] = useState5(null), [loadingOlder, setLoadingOlder] = useState5(false), [historyError, setHistoryError] = useState5(false);
  const [newCount, setNewCount] = useState5(0), [attempt, setAttempt] = useState5(0), [retrySeconds, setRetrySeconds] = useState5(0);
  const scrollPosition = useRef3(0);
  const follow = useRef3(true), pending = useRef3([]), known = useRef3(/* @__PURE__ */ new Set()), currentCursor = useRef3(null);
  const paging = useRef3(false), older = useRef3(null), generation = useRef3(0), retryAt = useRef3(0), starting = useRef3(false);
  const restore = useRef3(null);
  const refresh = useCallback2(() => {
    starting.current = true;
    generation.current++;
    older.current?.abort();
    paging.current = false;
    restore.current = null;
    pending.current = [];
    known.current.clear();
    currentCursor.current = null;
    follow.current = true;
    retryAt.current = 0;
    setRetrySeconds(0);
    setLogs([]);
    setCursor(null);
    setNewCount(0);
    setLoadingOlder(false);
    setHistoryError(false);
    setState("loading");
    setAttempt((value) => value + 1);
  }, []);
  useEffect5(() => {
    const version = ++generation.current, source = openLogStream(`${basePath}/stream?range=${range}`);
    let active = true, terminal = false;
    const fail = () => {
      if (!active || terminal) return;
      terminal = true;
      source.close();
      starting.current = false;
      retryAt.current = Date.now() + 3e4;
      setRetrySeconds(30);
      setState("error");
    };
    let paused = false;
    let hiddenTimer;
    const visibilityChanged = () => {
      clearTimeout(hiddenTimer);
      if (document.visibilityState === "hidden") {
        if (paused) return;
        hiddenTimer = setTimeout(() => {
          if (!active || document.visibilityState !== "hidden") return;
          paused = true;
          terminal = true;
          source.close();
          generation.current++;
          older.current?.abort();
          paging.current = false;
          setLoadingOlder(false);
          setState("paused");
        }, 6e4);
      } else if (paused) {
        paused = false;
        refresh();
      }
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    visibilityChanged();
    source.addEventListener("history", (event) => {
      try {
        const page = JSON.parse(
          event.data
        );
        if (!validRealtimeLogs(page.logs) || page.nextCursor !== null && typeof page.nextCursor !== "string")
          throw Error();
        if (!active || terminal) return;
        known.current = new Set(page.logs.map((log) => log.id));
        setLogs(mergeRealtimeLogs([], page.logs));
        currentCursor.current = page.nextCursor;
        setCursor(page.nextCursor);
      } catch {
        fail();
      }
    });
    source.addEventListener("logs", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!validRealtimeLogs(data.logs)) throw Error();
        if (!active || terminal) return;
        const fresh = data.logs.filter(
          (log) => !known.current.has(log.id)
        );
        fresh.forEach((log) => known.current.add(log.id));
        if (follow.current)
          setLogs((previous) => mergeRealtimeLogs(previous, fresh));
        else {
          pending.current = mergeRealtimeLogs(pending.current, fresh);
          if (pending.current.length > 1e3) {
            fail();
            return;
          }
          setNewCount(pending.current.length);
        }
      } catch {
        fail();
      }
    });
    source.addEventListener("ready", () => {
      if (active && !terminal) setState("live");
    });
    source.addEventListener("stream-error", fail);
    source.onerror = fail;
    return () => {
      active = false;
      terminal = true;
      generation.current = version + 1;
      clearTimeout(hiddenTimer);
      document.removeEventListener("visibilitychange", visibilityChanged);
      source.close();
      older.current?.abort();
    };
  }, [attempt, refresh, basePath, range]);
  useLayoutEffect(() => {
    const element = tail.current;
    if (!element || !isActive) return;
    if (restore.current) {
      element.scrollTop = restore.current.top + element.scrollHeight - restore.current.height;
      restore.current = null;
    } else if (follow.current) element.scrollTop = element.scrollHeight;
    else element.scrollTop = scrollPosition.current;
  }, [logs, tail, isActive]);
  const cooling = retrySeconds > 0;
  useEffect5(() => {
    if (!cooling || state !== "error") return;
    const timer = setInterval(
      () => setRetrySeconds(
        Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1e3))
      ),
      1e3
    );
    return () => clearInterval(timer);
  }, [cooling, state]);
  const loadOlder = async () => {
    const next = currentCursor.current;
    if (!isActive || !next || paging.current || document.visibilityState === "hidden")
      return;
    paging.current = true;
    setLoadingOlder(true);
    setHistoryError(false);
    const abort = new AbortController(), version = generation.current;
    older.current = abort;
    follow.current = false;
    try {
      const query = new URLSearchParams({ range, cursor: next });
      const response = await fetch(`${basePath}?${query}`, {
        cache: "no-store",
        signal: abort.signal
      });
      if (!response.ok) throw Error();
      const page = await response.json();
      if (!validRealtimeLogs(page.logs) || page.nextCursor !== null && typeof page.nextCursor !== "string")
        throw Error();
      if (abort.signal.aborted || version !== generation.current) return;
      const element = tail.current;
      if (element)
        restore.current = {
          height: element.scrollHeight,
          top: element.scrollTop
        };
      page.logs.forEach((log) => known.current.add(log.id));
      const loaded = new Set(page.logs.map((log) => log.id));
      pending.current = pending.current.filter((log) => !loaded.has(log.id));
      setNewCount(pending.current.length);
      setLogs((previous) => mergeRealtimeLogs(previous, page.logs));
      currentCursor.current = page.nextCursor;
      setCursor(page.nextCursor);
    } catch {
      if (!abort.signal.aborted && version === generation.current)
        setHistoryError(true);
    } finally {
      if (version === generation.current) {
        paging.current = false;
        setLoadingOlder(false);
      }
    }
  };
  const onScroll = () => {
    const element = tail.current;
    if (!element || !isActive) return;
    scrollPosition.current = element.scrollTop;
    follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40 && pending.current.length === 0;
    if (element.scrollTop < 80 && element.scrollHeight > element.clientHeight && !historyError)
      void loadOlder();
  };
  const showLatest = () => {
    const updates = pending.current;
    pending.current = [];
    follow.current = true;
    restore.current = null;
    setLogs((previous) => mergeRealtimeLogs(previous, updates));
    setNewCount(0);
    if (tail.current) tail.current.scrollTop = tail.current.scrollHeight;
  };
  const reconnect = () => {
    if (starting.current || Date.now() < retryAt.current) return;
    refresh();
  };
  return {
    attachTail,
    logs,
    state,
    cursor,
    loadingOlder,
    historyError,
    newCount,
    retrySeconds,
    onScroll,
    loadOlder,
    showLatest,
    reconnect
  };
}

// src/dashboard/incident-logs.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function IncidentLogs({
  conditionKey
}) {
  const {
    attachTail,
    logs: records,
    state,
    cursor,
    loadingOlder,
    historyError,
    newCount,
    retrySeconds,
    onScroll,
    loadOlder,
    showLatest,
    reconnect
  } = useRealtimeLogs(
    `/api/oneminutelogs/dashboard/incidents/${conditionKey}/logs`,
    "24h"
  );
  const [level, setLevel] = useState6("All levels");
  const [selected, setSelected] = useState6(null);
  const dialog = useRef4(null);
  const logs = records.map(presentLog).filter((log) => level === "All levels" || log.severity === level);
  useEffect6(() => {
    if (!selected) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [selected]);
  return /* @__PURE__ */ jsxs5(
    "section",
    {
      className: incidents_default.relatedLogs,
      "aria-labelledby": "incident-logs-heading",
      children: [
        /* @__PURE__ */ jsxs5("div", { className: incidents_default.logControls, children: [
          /* @__PURE__ */ jsx5("h3", { id: "incident-logs-heading", children: "Related live logs" }),
          /* @__PURE__ */ jsxs5("label", { className: apm_default.selectLabel, children: [
            /* @__PURE__ */ jsx5("span", { className: apm_default.srOnly, children: "Related log severity" }),
            /* @__PURE__ */ jsxs5(
              "select",
              {
                value: level,
                onChange: (event) => setLevel(event.target.value),
                children: [
                  /* @__PURE__ */ jsx5("option", { children: "All levels" }),
                  ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"].map(
                    (value) => /* @__PURE__ */ jsx5("option", { children: value }, value)
                  )
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx5("span", { role: "status", children: state === "live" ? "Live" : state === "loading" ? "Loading\u2026" : state === "paused" ? "Paused while tab is inactive" : "Disconnected" }),
          /* @__PURE__ */ jsx5("button", { className: apm_default.newLogs, onClick: showLatest, children: newCount ? `${newCount} new logs \u2193` : "Latest \u2193" })
        ] }),
        /* @__PURE__ */ jsxs5(
          "div",
          {
            className: incidents_default.relatedTail,
            ref: attachTail,
            onScroll,
            tabIndex: 0,
            "aria-label": "Incident related logs, oldest first",
            children: [
              cursor && /* @__PURE__ */ jsx5("div", { className: incidents_default.logContext, children: /* @__PURE__ */ jsx5("button", { disabled: loadingOlder, onClick: () => void loadOlder(), children: loadingOlder ? "Loading older logs\u2026" : "Scroll up to load 20 older logs" }) }),
              historyError && /* @__PURE__ */ jsxs5("p", { className: incidents_default.logContext, role: "alert", children: [
                "Unable to load older logs.",
                " ",
                /* @__PURE__ */ jsx5("button", { onClick: () => void loadOlder(), children: "Try again" })
              ] }),
              state === "loading" ? Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ jsx5("div", { className: incidents_default.relatedLog, "aria-hidden": "true", children: /* @__PURE__ */ jsx5("span", { className: apm_default.skeleton, style: { width: "70%" } }) }, index)) : logs.length ? logs.map((log) => /* @__PURE__ */ jsxs5(
                "button",
                {
                  className: incidents_default.relatedLog,
                  onClick: () => setSelected(log.record),
                  "aria-label": `Inspect related log: ${log.body}`,
                  children: [
                    /* @__PURE__ */ jsx5("time", { children: log.timestamp.slice(11, 23) }),
                    /* @__PURE__ */ jsx5(
                      "strong",
                      {
                        className: log.severity === "ERROR" || log.severity === "FATAL" ? apm_default.error : log.severity === "WARN" ? apm_default.warn : apm_default.info,
                        children: log.severity
                      }
                    ),
                    /* @__PURE__ */ jsxs5("span", { className: incidents_default.relatedMessage, children: [
                      log.body,
                      /* @__PURE__ */ jsxs5("small", { children: [
                        log.service,
                        " \xB7",
                        " ",
                        log.durationMs === void 0 ? "Duration unavailable" : `${log.durationMs.toFixed(2)} ms`
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx5("span", { className: incidents_default.inspectJson, children: "JSON \u2197" })
                  ]
                },
                log.id
              )) : /* @__PURE__ */ jsx5("p", { className: incidents_default.logContext, children: state === "error" ? "Log stream unavailable." : records.length ? "No loaded logs match this severity." : "No matching logs in the last 24 hours. Waiting for new logs\u2026" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs5("div", { className: incidents_default.logFootnote, children: [
          /* @__PURE__ */ jsxs5("span", { children: [
            logs.length,
            " / ",
            records.length,
            " loaded records \xB7 UTC \xB7 Last 24 hours"
          ] }),
          /* @__PURE__ */ jsx5("span", { children: "Matching telemetry does not establish root cause" })
        ] }),
        state === "error" && /* @__PURE__ */ jsxs5("div", { className: incidents_default.logContext, role: "alert", children: [
          "Live logs interrupted.",
          " ",
          /* @__PURE__ */ jsx5("button", { disabled: retrySeconds > 0, onClick: reconnect, children: retrySeconds > 0 ? `Reconnect in ${retrySeconds}s` : "Reconnect" })
        ] }),
        selected && /* @__PURE__ */ jsxs5(
          "dialog",
          {
            ref: dialog,
            className: apm_default.logDialog,
            "aria-labelledby": "incident-log-json",
            onCancel: () => setSelected(null),
            onClose: () => setSelected(null),
            onClick: (event) => {
              if (event.target !== event.currentTarget) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
                setSelected(null);
            },
            children: [
              /* @__PURE__ */ jsxs5("div", { className: apm_default.dialogHeading, children: [
                /* @__PURE__ */ jsxs5("div", { children: [
                  /* @__PURE__ */ jsx5("h2", { id: "incident-log-json", children: "Full log record" }),
                  /* @__PURE__ */ jsxs5("p", { children: [
                    selected.serviceName,
                    " \xB7 ",
                    selected.timestamp
                  ] })
                ] }),
                /* @__PURE__ */ jsx5(
                  "button",
                  {
                    autoFocus: true,
                    "aria-label": "Close log details",
                    onClick: () => setSelected(null),
                    children: /* @__PURE__ */ jsx5(
                      "svg",
                      {
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "1.6",
                        strokeLinecap: "round",
                        "aria-hidden": "true",
                        children: /* @__PURE__ */ jsx5("path", { d: "m6 6 12 12M18 6 6 18" })
                      }
                    )
                  }
                )
              ] }),
              /* @__PURE__ */ jsx5("pre", { className: apm_default.logJson, tabIndex: 0, children: JSON.stringify(selected, null, 2) })
            ]
          }
        )
      ]
    }
  );
}

// src/dashboard/incidents.tsx
import { Fragment as Fragment3, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var sources = {
  backend_logs: "Backend logs",
  rum_network: "API requests \xB7 RUM evidence",
  rum_javascript: "Browser JavaScript"
};
var metrics = {
  latency_mean: "Average response time",
  http_failure_share: "HTTP failure rate",
  observed_occurrences: "Recorded event frequency",
  observed_error_share: "Backend error share"
};
var stateDescription = {
  suspected: "An unusual observation needs further qualified evidence before activation.",
  active: "Repeated qualified anomaly observations activated this incident.",
  recovering: "Qualified healthy observations indicate improvement. Recovery is still being verified.",
  resolved: "Qualified healthy observations met the recovery requirement. This does not prove a root cause was fixed."
};
function format(value, unit) {
  if (unit === "ratio") return `${(value * 100).toFixed(1)}%`;
  if (unit === "ms") return `${Math.round(value)} ms`;
  return `${Number(value.toFixed(1))} / min exposure`;
}
var time2 = (value) => new Date(value).toLocaleTimeString("en-GB", {
  timeZone: "UTC",
  hour12: false
});
function scope(incident) {
  const key = incident.identity.key;
  return key.dimensions.endpoint ? `${key.dimensions.method} ${key.dimensions.endpoint}` : key.source === "rum_javascript" ? "JavaScript error pattern" : key.entity;
}
function title2(incident) {
  return `${metrics[incident.identity.metric] ?? incident.identity.metric} ${incident.identity.direction === "increase" ? "increased" : "decreased"}`;
}
function Incidents({
  initialConditionKey
}) {
  const cache = useDashboardCache();
  const root = useRef5(null);
  const header = useRef5(null);
  useEffect7(() => {
    const element = header.current;
    if (!element) return;
    const measure = () => root.current?.style.setProperty(
      "--incident-header-height",
      `${element.getBoundingClientRect().height}px`
    );
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);
  const [state, setState] = useState7("All states");
  const [source, setSource] = useState7("All sources");
  const [selectedKey, setSelectedKey] = useState7(initialConditionKey ?? "");
  const [incidents, setIncidents] = useState7([]);
  const [summary, setSummary] = useState7(null);
  const [nextCursor, setNextCursor] = useState7(null);
  const [loading, setLoading] = useState7(true), [failed, setFailed] = useState7(false);
  const [loadingMore, setLoadingMore] = useState7(false), [pageFailed, setPageFailed] = useState7(false);
  const [generatedAt, setGeneratedAt] = useState7(null);
  const paging = useRef5(false), older = useRef5(null), generation = useRef5(0);
  useEffect7(() => {
    const controller = new AbortController(), version = ++generation.current;
    const query = new URLSearchParams();
    if (state !== "All states") query.set("state", state);
    if (source !== "All sources") query.set("source", source);
    Promise.all([
      fetchIncidentPage(cache, query),
      initialConditionKey && state === "All states" && source === "All sources" ? fetchIncident(cache, initialConditionKey) : Promise.resolve(null)
    ]).then(([page, deep]) => {
      if (!page || !Array.isArray(page.incidents) || !page.summary)
        throw Error();
      if (controller.signal.aborted || version !== generation.current) return;
      const rows = deep && !page.incidents.some(
        (item) => item.conditionKey === deep.conditionKey
      ) ? [deep, ...page.incidents] : page.incidents;
      setIncidents(rows);
      if (deep && initialConditionKey) setSelectedKey(initialConditionKey);
      setSummary(page.summary);
      setNextCursor(page.nextCursor);
      setGeneratedAt(page.generatedAt);
      setFailed(false);
    }).catch(() => {
      if (!controller.signal.aborted && version === generation.current)
        setFailed(true);
    }).finally(() => {
      if (!controller.signal.aborted && version === generation.current)
        setLoading(false);
    });
    return () => {
      controller.abort();
      older.current?.abort();
    };
  }, [state, source, initialConditionKey]);
  const changeFilters = (nextState, nextSource) => {
    if (nextState === state && nextSource === source) return;
    generation.current++;
    older.current?.abort();
    paging.current = false;
    setState(nextState);
    setSource(nextSource);
    setIncidents([]);
    setNextCursor(null);
    setLoading(true);
    setFailed(false);
    setPageFailed(false);
    setLoadingMore(false);
  };
  const loadMore = async () => {
    if (!nextCursor || paging.current) return;
    paging.current = true;
    setLoadingMore(true);
    setPageFailed(false);
    const controller = new AbortController(), version = generation.current;
    older.current = controller;
    const query = new URLSearchParams({ cursor: nextCursor });
    if (state !== "All states") query.set("state", state);
    if (source !== "All sources") query.set("source", source);
    try {
      const page = await fetchIncidentPage(cache, query);
      if (controller.signal.aborted || version !== generation.current) return;
      setIncidents((previous) => [
        ...new Map(
          [...previous, ...page.incidents].map((item) => [
            item.conditionKey,
            item
          ])
        ).values()
      ]);
      setNextCursor(page.nextCursor);
      setSummary(page.summary);
    } catch {
      if (!controller.signal.aborted && version === generation.current)
        setPageFailed(true);
    } finally {
      if (version === generation.current) {
        paging.current = false;
        setLoadingMore(false);
      }
    }
  };
  const filtered = incidents;
  const selected = filtered.find((incident) => incident.conditionKey === selectedKey) ?? filtered[0];
  const latest = selected?.latest;
  return /* @__PURE__ */ jsxs6("div", { ref: root, className: `${apm_default.apm} ${incidents_default.incidents}`, children: [
    /* @__PURE__ */ jsxs6("div", { ref: header, className: incidents_default.stickyHeader, children: [
      /* @__PURE__ */ jsxs6("div", { className: dashboard_default.pageHeading, children: [
        /* @__PURE__ */ jsx6("h1", { children: "Incidents" }),
        /* @__PURE__ */ jsx6("p", { children: "Investigate unusual behavior and ongoing issues." })
      ] }),
      /* @__PURE__ */ jsx6("div", { className: incidents_default.snapshot, children: loading ? "Loading incidents\u2026" : failed ? "Incidents unavailable" : generatedAt ? `Updated ${new Date(generatedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC` : "" }),
      /* @__PURE__ */ jsx6("section", { className: apm_default.summary, "aria-label": "Project incident states", children: ["active", "suspected", "recovering", "resolved"].map(
        (item) => /* @__PURE__ */ jsxs6("article", { children: [
          /* @__PURE__ */ jsx6("span", { className: incidents_default.capitalize, children: item }),
          /* @__PURE__ */ jsx6("strong", { className: item === "active" ? apm_default.error : "", children: loading ? /* @__PURE__ */ jsx6(
            "span",
            {
              className: apm_default.skeleton,
              style: { width: 60, height: 30 }
            }
          ) : failed ? "\u2014" : summary?.[item] ?? 0 }),
          /* @__PURE__ */ jsx6("small", { children: item === "active" ? "Need investigation" : item === "suspected" ? "Awaiting qualified confirmation" : item === "recovering" ? "Healthy recovery being verified" : "Qualified recovery completed" })
        ] }, item)
      ) }),
      /* @__PURE__ */ jsxs6("div", { className: incidents_default.filters, children: [
        /* @__PURE__ */ jsxs6("div", { children: [
          /* @__PURE__ */ jsx6("h2", { children: "Incident inbox" }),
          /* @__PURE__ */ jsx6("p", { children: "What changed, where it happened, and what the evidence supports." })
        ] }),
        /* @__PURE__ */ jsxs6("label", { className: apm_default.selectLabel, children: [
          /* @__PURE__ */ jsx6("span", { className: apm_default.srOnly, children: "Incident state" }),
          /* @__PURE__ */ jsxs6(
            "select",
            {
              value: state,
              onChange: (event) => changeFilters(event.target.value, source),
              children: [
                /* @__PURE__ */ jsx6("option", { children: "All states" }),
                ["suspected", "active", "recovering", "resolved"].map((item) => /* @__PURE__ */ jsx6("option", { value: item, children: item[0].toUpperCase() + item.slice(1) }, item))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs6("label", { className: apm_default.selectLabel, children: [
          /* @__PURE__ */ jsx6("span", { className: apm_default.srOnly, children: "Incident source" }),
          /* @__PURE__ */ jsxs6(
            "select",
            {
              value: source,
              onChange: (event) => changeFilters(state, event.target.value),
              children: [
                /* @__PURE__ */ jsx6("option", { children: "All sources" }),
                Object.entries(sources).map(([key, label]) => /* @__PURE__ */ jsx6("option", { value: key, children: label }, key))
              ]
            }
          )
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxs6("div", { className: incidents_default.workspace, children: [
      /* @__PURE__ */ jsx6("div", { className: incidents_default.inbox, children: Array.from({ length: 3 }, (_, i) => /* @__PURE__ */ jsx6(
        "div",
        {
          className: incidents_default.incidentCard,
          "aria-hidden": "true",
          style: { minHeight: 180 },
          children: /* @__PURE__ */ jsx6("span", { className: apm_default.skeleton, style: { width: "75%" } })
        },
        i
      )) }),
      /* @__PURE__ */ jsx6(
        "div",
        {
          className: apm_default.panel,
          style: { minHeight: 520, padding: 28 },
          role: "status",
          children: "Loading incident details\u2026"
        }
      )
    ] }) : failed ? /* @__PURE__ */ jsx6("div", { className: `${apm_default.panel} ${apm_default.empty}`, role: "alert", children: "Unable to load incidents. Please reopen this page to try again." }) : !selected ? /* @__PURE__ */ jsxs6("div", { className: `${apm_default.panel} ${apm_default.empty}`, children: [
      "No incidents match these filters.",
      /* @__PURE__ */ jsx6("button", { onClick: () => changeFilters("All states", "All sources"), children: "Clear filters" })
    ] }) : /* @__PURE__ */ jsxs6("div", { className: incidents_default.workspace, children: [
      /* @__PURE__ */ jsxs6(
        "div",
        {
          className: incidents_default.inbox,
          role: "group",
          "aria-label": "Select an incident",
          children: [
            filtered.map((incident) => /* @__PURE__ */ jsxs6(
              "button",
              {
                "aria-pressed": incident.conditionKey === selected.conditionKey,
                className: `${incidents_default.incidentCard} ${incident.conditionKey === selected.conditionKey ? incidents_default.selected : ""}`,
                onClick: () => setSelectedKey(incident.conditionKey),
                children: [
                  /* @__PURE__ */ jsxs6("span", { className: incidents_default.cardTop, children: [
                    /* @__PURE__ */ jsx6("span", { className: `${incidents_default.badge} ${incidents_default[incident.state]}`, children: incident.state }),
                    /* @__PURE__ */ jsxs6("time", { children: [
                      time2(incident.updatedAt),
                      " UTC"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx6("strong", { children: title2(incident) }),
                  /* @__PURE__ */ jsx6("span", { className: incidents_default.cardScope, children: scope(incident) }),
                  /* @__PURE__ */ jsxs6("span", { className: incidents_default.cardMetric, children: [
                    incident.latest ? format(incident.latest.value, incident.latest.unit) : "Measurement unavailable",
                    /* @__PURE__ */ jsxs6("small", { children: [
                      "expected",
                      " ",
                      incident.latest ? format(incident.latest.center, incident.latest.unit) : "unknown"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs6("span", { className: incidents_default.cardBottom, children: [
                    sources[incident.identity.key.source],
                    /* @__PURE__ */ jsx6("span", { children: incident.severity === "error" ? "Error" : "Warning" })
                  ] })
                ]
              },
              incident.conditionKey
            )),
            nextCursor && /* @__PURE__ */ jsx6(
              "button",
              {
                className: incidents_default.incidentCard,
                disabled: loadingMore,
                onClick: () => void loadMore(),
                children: loadingMore ? "Loading\u2026" : "Load 25 more incidents"
              }
            ),
            pageFailed && /* @__PURE__ */ jsx6("p", { role: "alert", children: "Unable to load more incidents. Try again." })
          ]
        }
      ),
      /* @__PURE__ */ jsxs6(
        "section",
        {
          className: `${apm_default.panel} ${incidents_default.report}`,
          "aria-labelledby": "incident-title",
          children: [
            /* @__PURE__ */ jsxs6("div", { className: incidents_default.reportHeading, children: [
              /* @__PURE__ */ jsxs6("div", { className: incidents_default.reportBadges, children: [
                /* @__PURE__ */ jsx6("span", { className: `${incidents_default.badge} ${incidents_default[selected.state]}`, children: selected.state }),
                /* @__PURE__ */ jsx6(
                  "span",
                  {
                    className: selected.severity === "error" ? apm_default.error : apm_default.warn,
                    children: selected.severity === "error" ? "Error severity" : "Warning severity"
                  }
                ),
                /* @__PURE__ */ jsx6("span", { children: selected.identity.key.environment })
              ] }),
              /* @__PURE__ */ jsx6("h2", { id: "incident-title", children: title2(selected) }),
              /* @__PURE__ */ jsxs6("p", { children: [
                scope(selected),
                " \xB7 Evidence:",
                " ",
                sources[selected.identity.key.source]
              ] })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: incidents_default.summaryText, children: [
              /* @__PURE__ */ jsx6("strong", { children: selected.state === "recovering" || selected.state === "resolved" ? "Latest recovery evidence" : "What changed" }),
              /* @__PURE__ */ jsx6("p", { children: latest ? /* @__PURE__ */ jsxs6(Fragment3, { children: [
                "The latest recorded",
                " ",
                (metrics[selected.identity.metric] ?? selected.identity.metric).toLowerCase(),
                " ",
                "is ",
                /* @__PURE__ */ jsx6("b", { children: format(latest.value, latest.unit) }),
                ". The expected baseline is ",
                /* @__PURE__ */ jsx6("b", { children: format(latest.center, latest.unit) }),
                ", with an expected range of",
                " ",
                format(latest.lower, latest.unit),
                "\u2013",
                format(latest.upper, latest.unit),
                "."
              ] }) : "No numerical measurement is available." }),
              /* @__PURE__ */ jsx6("p", { children: stateDescription[selected.state] })
            ] }),
            latest && /* @__PURE__ */ jsxs6(
              "div",
              {
                className: incidents_default.comparison,
                "aria-label": "Observed versus expected measurement",
                children: [
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("span", { children: "Latest observed" }),
                    /* @__PURE__ */ jsx6(
                      "strong",
                      {
                        className: selected.lastWindow.outcome === "candidate" ? apm_default.error : apm_default.info,
                        children: format(latest.value, latest.unit)
                      }
                    ),
                    /* @__PURE__ */ jsxs6("small", { children: [
                      latest.samples,
                      " measurement samples"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("span", { children: "Expected baseline" }),
                    /* @__PURE__ */ jsx6("strong", { children: format(latest.center, latest.unit) }),
                    /* @__PURE__ */ jsxs6("small", { children: [
                      "Range ",
                      format(latest.lower, latest.unit),
                      "\u2013",
                      format(latest.upper, latest.unit)
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs6("div", { className: incidents_default.quality, children: [
              /* @__PURE__ */ jsx6("strong", { children: selected.lastWindow.confirmed ? "Qualified latest window" : "Provisional latest window" }),
              /* @__PURE__ */ jsxs6("p", { children: [
                time2(selected.lastWindow.start),
                "\u2013",
                time2(selected.lastWindow.end),
                " UTC \xB7",
                " ",
                selected.lastWindow.outcome === "healthy" ? "Qualified healthy observation" : selected.lastWindow.outcome === "unknown" ? "Observation unavailable" : "Anomaly observation"
              ] }),
              selected.uncertainty.map((reason) => /* @__PURE__ */ jsx6("p", { children: reason === "backend_duplicate_risk" ? "Backend retries may inflate counts; duplicate uncertainty remains." : reason === "provisional_observation" ? "Provisional evidence cannot independently confirm activation or recovery." : reason.replaceAll("_", " ") }, reason))
            ] }),
            /* @__PURE__ */ jsxs6("dl", { className: incidents_default.facts, children: [
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx6("dt", { children: "First observed" }),
                /* @__PURE__ */ jsxs6("dd", { children: [
                  time2(selected.firstSeenAt),
                  " UTC"
                ] })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx6("dt", { children: "Last observed" }),
                /* @__PURE__ */ jsxs6("dd", { children: [
                  time2(selected.lastSeenAt),
                  " UTC"
                ] })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx6("dt", { children: "Activated" }),
                /* @__PURE__ */ jsx6("dd", { children: selected.activeAt ? `${time2(selected.activeAt)} UTC` : "Not activated" })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx6("dt", { children: "Resolved" }),
                /* @__PURE__ */ jsx6("dd", { children: selected.resolvedAt ? `${time2(selected.resolvedAt)} UTC` : "Not resolved" })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx6("dt", { children: "Recovery progress" }),
                /* @__PURE__ */ jsxs6("dd", { children: [
                  selected.healthyStreak,
                  " consecutive qualified healthy windows"
                ] })
              ] }),
              /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsx6("dt", { children: "Model evidence" }),
                /* @__PURE__ */ jsxs6("dd", { children: [
                  "Version ",
                  latest?.modelVersion ?? "unknown",
                  " \xB7 trained through",
                  " ",
                  latest ? `${time2(latest.trainedThrough)} UTC` : "unknown"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx6(
              IncidentLogs,
              {
                conditionKey: selected.conditionKey
              },
              selected.conditionKey
            ),
            /* @__PURE__ */ jsxs6("div", { className: incidents_default.evidence, children: [
              /* @__PURE__ */ jsx6("h3", { children: "Recorded evidence" }),
              selected.evidence?.length ? selected.evidence.map((reference, index) => /* @__PURE__ */ jsxs6("details", { children: [
                /* @__PURE__ */ jsxs6("summary", { children: [
                  time2(reference.windowStart),
                  "\u2013",
                  time2(reference.windowEnd),
                  " ",
                  "UTC \xB7 ",
                  reference.source,
                  " \xB7 revision ",
                  reference.revision
                ] }),
                /* @__PURE__ */ jsx6("pre", { tabIndex: 0, children: JSON.stringify(reference, null, 2) })
              ] }, index)) : /* @__PURE__ */ jsx6("p", { children: "No evidence references were returned for this incident." })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: incidents_default.lifecycle, children: [
              /* @__PURE__ */ jsx6("h3", { children: "Recent lifecycle" }),
              /* @__PURE__ */ jsx6("p", { children: "Bounded observation history, not the complete incident history." }),
              /* @__PURE__ */ jsx6("ol", { children: selected.timeline.map((entry, index) => /* @__PURE__ */ jsxs6("li", { children: [
                /* @__PURE__ */ jsxs6("time", { children: [
                  time2(entry.at),
                  " UTC"
                ] }),
                /* @__PURE__ */ jsx6("span", { className: `${incidents_default.badge} ${incidents_default[entry.state]}`, children: entry.state }),
                /* @__PURE__ */ jsx6("span", { children: entry.outcome === "healthy" ? "Qualified healthy evidence" : entry.outcome === "unknown" ? "Observation unavailable" : "Anomaly observation" }),
                /* @__PURE__ */ jsx6("strong", { children: entry.value === null || !latest ? "Unknown" : format(entry.value, latest.unit) })
              ] }, index)) })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: incidents_default.evidence, children: [
              /* @__PURE__ */ jsx6("h3", { children: "Investigation context" }),
              /* @__PURE__ */ jsx6("p", { children: "Root cause is not established. Correlated logs and traces are not returned by the incident API." }),
              selected.identity.key.dimensions.fingerprint && /* @__PURE__ */ jsxs6("p", { children: [
                "Diagnostic fingerprint:",
                " ",
                /* @__PURE__ */ jsx6("code", { children: selected.identity.key.dimensions.fingerprint })
              ] }),
              /* @__PURE__ */ jsxs6("details", { children: [
                /* @__PURE__ */ jsx6("summary", { children: "Signal and revision details" }),
                /* @__PURE__ */ jsxs6("dl", { className: incidents_default.facts, children: [
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("dt", { children: "Incident ID" }),
                    /* @__PURE__ */ jsx6("dd", { children: selected.id })
                  ] }),
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("dt", { children: "Condition key" }),
                    /* @__PURE__ */ jsx6("dd", { children: selected.conditionKey })
                  ] }),
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("dt", { children: "Metric" }),
                    /* @__PURE__ */ jsx6("dd", { children: selected.identity.metric })
                  ] }),
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("dt", { children: "Revision / episode" }),
                    /* @__PURE__ */ jsxs6("dd", { children: [
                      selected.revision,
                      " / ",
                      selected.episode
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs6("div", { children: [
                    /* @__PURE__ */ jsx6("dt", { children: "Reason codes" }),
                    /* @__PURE__ */ jsx6("dd", { children: selected.latestReasons.length ? selected.latestReasons.join(", ") : "No additional reason codes recorded" })
                  ] })
                ] })
              ] })
            ] })
          ]
        }
      )
    ] })
  ] });
}

// src/dashboard/alerts.tsx
import { useEffect as useEffect8, useRef as useRef6, useState as useState8 } from "react";

// src/dashboard/lib/alert-requests.ts
var url = "/api/oneminutelogs/alerts/custom-rules";
function fetchCustomRules(cache) {
  return cache.remember(url, async () => {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(2e4) });
    if (!response.ok) throw Error("Unable to load custom rules");
    const rules = await response.json();
    if (!Array.isArray(rules)) throw Error("Invalid custom rules response");
    return rules;
  });
}
async function createCustomRule(cache, payload) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(2e4) });
  const value = await response.json();
  if (!response.ok) throw Error(value.error || "Unable to create custom rule");
  cache.invalidate(url);
  return value;
}
async function deleteCustomRule(cache, ruleId) {
  const response = await fetch(`${url}?ruleId=${encodeURIComponent(ruleId)}`, { method: "DELETE", signal: AbortSignal.timeout(2e4) });
  const value = await response.json();
  if (!response.ok) throw Error(value.error || "Unable to delete custom rule");
  cache.invalidate(url);
}

// src/dashboard/alerts.module.css
var alerts_default = {
  alerts: "alerts_alerts",
  topline: "alerts_topline",
  create: "alerts_create",
  summary: "alerts_summary",
  tabs: "alerts_tabs",
  selected: "alerts_selected",
  tabCount: "alerts_tabCount",
  list: "alerts_list",
  card: "alerts_card",
  cardTop: "alerts_cardTop",
  badge: "alerts_badge",
  errorBadge: "alerts_errorBadge",
  warningBadge: "alerts_warningBadge",
  neutralBadge: "alerts_neutralBadge",
  cardBottom: "alerts_cardBottom",
  draftLabel: "alerts_draftLabel",
  remove: "alerts_remove",
  empty: "alerts_empty",
  emptyIcon: "alerts_emptyIcon",
  form: "alerts_form",
  condition: "alerts_condition",
  formGrid: "alerts_formGrid",
  formActions: "alerts_formActions",
  cancel: "alerts_cancel",
  automaticCard: "alerts_automaticCard",
  signalIcon: "alerts_signalIcon",
  errorIcon: "alerts_errorIcon",
  warningIcon: "alerts_warningIcon",
  priority: "alerts_priority",
  errorText: "alerts_errorText",
  warningText: "alerts_warningText",
  sourceLabel: "alerts_sourceLabel",
  alertContent: "alerts_alertContent",
  endpoint: "alerts_endpoint",
  alertActions: "alerts_alertActions",
  status: "alerts_status",
  previewLabel: "alerts_previewLabel",
  conditions: "alerts_conditions",
  conditionRow: "alerts_conditionRow",
  removeCondition: "alerts_removeCondition",
  addCondition: "alerts_addCondition",
  upgradeDialog: "alerts_upgradeDialog",
  upgradeContent: "alerts_upgradeContent",
  upgradeIcon: "alerts_upgradeIcon",
  upgradeActions: "alerts_upgradeActions",
  customCard: "alerts_customCard",
  ruleDeleteAction: "alerts_ruleDeleteAction",
  trashButton: "alerts_trashButton",
  deleteDialog: "alerts_deleteDialog",
  deleteContent: "alerts_deleteContent"
};

// src/dashboard/alerts.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var fields = [
  {
    key: "SeverityText",
    label: "Severity text",
    hint: "e.g. ERROR",
    numeric: false
  },
  {
    key: "SeverityNumber",
    label: "Severity number",
    hint: "e.g. 17",
    numeric: true
  },
  {
    key: "ServiceName",
    label: "Service name",
    hint: "e.g. checkout-api",
    numeric: false
  },
  {
    key: "Body",
    label: "Log message (Body)",
    hint: "e.g. timeout",
    numeric: false
  },
  {
    key: "EventName",
    label: "Event name",
    hint: "e.g. http.request.completed",
    numeric: false
  },
  {
    key: "ResourceAttributes.deployment.environment.name",
    label: "Environment",
    hint: "e.g. production",
    numeric: false
  },
  {
    key: "ScopeName",
    label: "Instrumentation scope",
    hint: "Scope name",
    numeric: false
  },
  { key: "TraceFlags", label: "Trace flags", hint: "e.g. 1", numeric: true }
];
var textOperators = [
  "Equals to",
  "Not equals to",
  "Contains",
  "Does not contain"
];
var operatorCodes = {
  "Equals to": "eq",
  "Not equals to": "ne",
  Contains: "contains",
  "Does not contain": "not_contains",
  "Greater than": "gt",
  "Greater than or equal to": "gte",
  "Less than": "lt",
  "Less than or equal to": "lte"
};
var numberOperators = [
  "Equals to",
  "Not equals to",
  "Greater than",
  "Greater than or equal to",
  "Less than",
  "Less than or equal to"
];
var emptyDraft = {
  name: "",
  conditions: [
    { field: "SeverityText", operator: "Equals to", value: "ERROR" }
  ],
  count: "10",
  minutes: "5"
};
function Alerts({
  onIncident,
  isFreePlan,
  onBilling
}) {
  const cache = useDashboardCache();
  const [tab, setTab] = useState8("All Alerts");
  const [creating, setCreating] = useState8(false);
  const [draft, setDraft] = useState8(emptyDraft);
  const [rules, setRules] = useState8([]);
  const [incidents, setIncidents] = useState8([]);
  const [total, setTotal] = useState8(0);
  const [cursor, setCursor] = useState8(null);
  const [loading, setLoading] = useState8(true);
  const [error, setError] = useState8("");
  const [saving, setSaving] = useState8(false);
  const submitting = useRef6(false);
  const [notice, setNotice] = useState8("");
  const [deleting, setDeleting] = useState8(null);
  const deletion = useRef6(false);
  const [deleteError, setDeleteError] = useState8("");
  const [pendingDelete, setPendingDelete] = useState8(null);
  const deleteDialog = useRef6(null);
  useEffect8(() => {
    if (!pendingDelete) return;
    const element = deleteDialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [pendingDelete]);
  async function removeRule(rule) {
    if (deletion.current) return;
    deletion.current = true;
    setDeleting(rule.id);
    setDeleteError("");
    try {
      await deleteCustomRule(cache, rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));
      setNotice(`Custom rule \u201C${rule.name}\u201D deleted.`);
      setPendingDelete(null);
    } catch (error2) {
      setDeleteError(
        error2 instanceof Error ? error2.message : "Unable to delete rule"
      );
    } finally {
      deletion.current = false;
      setDeleting(null);
    }
  }
  const [saveError, setSaveError] = useState8("");
  const [paging, setPaging] = useState8(false);
  useEffect8(() => {
    let active = true;
    Promise.all([
      fetchCustomRules(cache),
      fetchIncidentPage(cache, new URLSearchParams({ state: "active", limit: "50" }))
    ]).then(([saved, page]) => {
      if (!active) return;
      setRules(saved);
      setIncidents(page.incidents);
      setTotal(page.summary.active);
      setCursor(page.nextCursor);
    }).catch(() => {
      if (active) setError("Unable to load alerts. Please try again later.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const automatic = incidents.map((incident) => {
    const key = incident.identity.key;
    const metric = {
      latency_mean: "Average response time",
      http_failure_share: "HTTP failure rate",
      observed_occurrences: "Recorded event frequency",
      observed_error_share: "Backend error share"
    }[incident.identity.metric] || incident.identity.metric;
    const format2 = (value) => incident.latest?.unit === "ratio" ? `${(value * 100).toFixed(1)}%` : `${Number(value.toFixed(2))}${incident.latest?.unit === "ms" ? " ms" : ""}`;
    return {
      id: incident.id,
      conditionKey: incident.conditionKey,
      title: `${metric} ${incident.identity.direction === "increase" ? "increased" : "decreased"}`,
      scope: key.dimensions.endpoint ? `${key.dimensions.method || ""} ${key.dimensions.endpoint}` : key.entity,
      description: incident.latest ? `Latest observed: ${format2(incident.latest.value)}. Expected baseline: ${format2(incident.latest.center)}.` : "An active incident needs investigation.",
      severity: incident.severity === "error" ? "Error" : "Warning",
      time: new Date(incident.updatedAt).toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour12: false
      }) + " UTC"
    };
  });
  async function loadMore() {
    if (!cursor || paging) return;
    setPaging(true);
    try {
      const page = await fetchIncidentPage(
        cache,
        new URLSearchParams({ state: "active", limit: "50", cursor })
      );
      setIncidents((current) => [
        ...current,
        ...page.incidents.filter(
          (item) => !current.some(
            (existing) => existing.conditionKey === item.conditionKey
          )
        )
      ]);
      setCursor(page.nextCursor);
    } catch {
      setError("Unable to load more automatic alerts.");
    } finally {
      setPaging(false);
    }
  }
  const count = (value) => loading || error && !incidents.length && !rules.length ? "\u2014" : value;
  const dialog = useRef6(null);
  useEffect8(() => {
    if (!creating) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [creating]);
  return /* @__PURE__ */ jsxs7("div", { className: `${apm_default.apm} ${alerts_default.alerts}`, children: [
    notice && /* @__PURE__ */ jsx7("p", { role: "status", children: notice }),
    /* @__PURE__ */ jsx7("div", { className: alerts_default.topline, children: /* @__PURE__ */ jsxs7(
      "button",
      {
        className: alerts_default.create,
        disabled: loading || saving,
        onClick: () => {
          setSaveError("");
          setCreating(true);
        },
        children: [
          /* @__PURE__ */ jsxs7(
            "svg",
            {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.7",
              strokeLinecap: "round",
              "aria-hidden": "true",
              children: [
                /* @__PURE__ */ jsx7("path", { d: "M4 7h7m4 0h5M4 17h2m4 0h10" }),
                /* @__PURE__ */ jsx7("circle", { cx: "13", cy: "7", r: "2" }),
                /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "17", r: "2" })
              ]
            }
          ),
          " ",
          "Create Custom Rules"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs7("section", { className: alerts_default.summary, "aria-label": "Alert summary", children: [
      /* @__PURE__ */ jsxs7("article", { children: [
        /* @__PURE__ */ jsx7("span", { children: "Active Alerts" }),
        /* @__PURE__ */ jsx7("strong", { className: total ? apm_default.error : void 0, children: count(total) }),
        /* @__PURE__ */ jsx7("small", { children: "Automatic incidents needing attention" })
      ] }),
      /* @__PURE__ */ jsxs7("article", { children: [
        /* @__PURE__ */ jsx7("span", { children: "Automatic" }),
        /* @__PURE__ */ jsx7("strong", { children: count(total) }),
        /* @__PURE__ */ jsx7("small", { children: "Generated from anomaly incidents" })
      ] }),
      /* @__PURE__ */ jsxs7("article", { children: [
        /* @__PURE__ */ jsx7("span", { children: "Custom Rules" }),
        /* @__PURE__ */ jsx7("strong", { children: count(rules.length) }),
        /* @__PURE__ */ jsx7("small", { children: loading ? "Loading custom rules\u2026" : rules.length ? "Saved rules for this project" : "No custom rules configured" })
      ] })
    ] }),
    /* @__PURE__ */ jsx7("div", { className: alerts_default.tabs, role: "group", "aria-label": "Alert category", children: ["All Alerts", "Automatic", "Custom"].map((value) => /* @__PURE__ */ jsxs7(
      "button",
      {
        "aria-pressed": tab === value,
        className: tab === value ? alerts_default.selected : "",
        onClick: () => setTab(value),
        children: [
          value,
          /* @__PURE__ */ jsx7("span", { className: alerts_default.tabCount, children: value === "Custom" ? rules.length : value === "Automatic" ? total : total + rules.length })
        ]
      },
      value
    )) }),
    /* @__PURE__ */ jsxs7("div", { className: alerts_default.list, children: [
      tab !== "Custom" && automatic.map((alert) => /* @__PURE__ */ jsxs7(
        "article",
        {
          className: `${alerts_default.card} ${alerts_default.automaticCard}`,
          children: [
            /* @__PURE__ */ jsx7(
              "div",
              {
                className: `${alerts_default.signalIcon} ${alert.severity === "Error" ? alerts_default.errorIcon : alerts_default.warningIcon}`,
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsx7(
                  "svg",
                  {
                    width: "20",
                    height: "20",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.6",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    children: /* @__PURE__ */ jsx7(
                      "path",
                      {
                        d: alert.severity === "Error" ? "M4 17V7m5 14V3m5 13V8m5 11V5" : "M3 16h4l3-9 4 12 3-7h4"
                      }
                    )
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs7("div", { className: alerts_default.alertContent, children: [
              /* @__PURE__ */ jsxs7("div", { className: alerts_default.cardTop, children: [
                /* @__PURE__ */ jsx7(
                  "span",
                  {
                    className: `${alerts_default.priority} ${alert.severity === "Error" ? alerts_default.errorText : alerts_default.warningText}`,
                    children: alert.severity === "Error" ? "High priority" : "Warning"
                  }
                ),
                /* @__PURE__ */ jsx7("span", { className: alerts_default.sourceLabel, children: "Automatic" })
              ] }),
              /* @__PURE__ */ jsx7("h2", { children: alert.title }),
              /* @__PURE__ */ jsx7("p", { children: alert.description }),
              /* @__PURE__ */ jsx7("code", { className: alerts_default.endpoint, children: alert.scope })
            ] }),
            /* @__PURE__ */ jsxs7("div", { className: alerts_default.alertActions, children: [
              /* @__PURE__ */ jsxs7("span", { className: alerts_default.status, children: [
                /* @__PURE__ */ jsx7("i", { "aria-hidden": "true" }),
                "Active"
              ] }),
              /* @__PURE__ */ jsx7("time", { children: alert.time }),
              /* @__PURE__ */ jsxs7(
                "a",
                {
                  href: "#incidents",
                  onClick: (event) => {
                    event.preventDefault();
                    onIncident(alert.conditionKey);
                  },
                  children: [
                    "View incident ",
                    /* @__PURE__ */ jsx7("span", { "aria-hidden": "true", children: "\u2197" })
                  ]
                }
              )
            ] })
          ]
        },
        alert.id
      )),
      tab !== "Automatic" && rules.map((rule) => /* @__PURE__ */ jsxs7(
        "article",
        {
          className: `${alerts_default.card} ${alerts_default.customCard}`,
          children: [
            /* @__PURE__ */ jsxs7("div", { className: alerts_default.cardTop, children: [
              /* @__PURE__ */ jsx7("span", { className: `${alerts_default.badge} ${alerts_default.neutralBadge}`, children: "Custom" }),
              /* @__PURE__ */ jsx7("span", { className: alerts_default.draftLabel, children: rule.status })
            ] }),
            /* @__PURE__ */ jsx7("h2", { children: rule.name }),
            /* @__PURE__ */ jsxs7("p", { children: [
              rule.conditions.map(
                (condition) => `${fields.find((field) => field.key === condition.field)?.label || condition.field} ${{ eq: "equals", ne: "does not equal", contains: "contains", not_contains: "does not contain", gt: ">", gte: "\u2265", lt: "<", lte: "\u2264" }[condition.operator] || condition.operator} ${condition.value}`
              ).join(" AND "),
              " ",
              "\xB7 At least ",
              rule.threshold.count,
              " matches in",
              " ",
              rule.threshold.windowMinutes,
              " minutes."
            ] }),
            /* @__PURE__ */ jsx7("div", { className: alerts_default.ruleDeleteAction, children: /* @__PURE__ */ jsx7(
              "button",
              {
                className: alerts_default.trashButton,
                disabled: deleting !== null,
                onClick: () => {
                  setDeleteError("");
                  setPendingDelete(rule);
                },
                "aria-label": `Delete custom rule ${rule.name}`,
                children: /* @__PURE__ */ jsx7(
                  "svg",
                  {
                    width: "22",
                    height: "22",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.7",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx7("path", { d: "M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6m4-6v6" })
                  }
                )
              }
            ) }),
            rule.lastTriggeredAt && /* @__PURE__ */ jsxs7("small", { children: [
              "Last triggered:",
              " ",
              new Date(rule.lastTriggeredAt).toLocaleString("en-GB", {
                timeZone: "UTC"
              }),
              " ",
              "UTC"
            ] })
          ]
        },
        rule.id
      )),
      tab !== "Custom" && cursor && /* @__PURE__ */ jsx7(
        "button",
        {
          className: alerts_default.cancel,
          disabled: paging,
          onClick: loadMore,
          children: paging ? "Loading\u2026" : "Load more automatic alerts"
        }
      ),
      error && /* @__PURE__ */ jsx7("p", { role: "alert", children: error }),
      loading && Array.from({ length: 2 }, (_, index) => /* @__PURE__ */ jsxs7(
        "article",
        {
          className: alerts_default.card,
          "aria-label": "Loading alerts",
          "aria-busy": "true",
          children: [
            /* @__PURE__ */ jsx7(
              "div",
              {
                className: apm_default.skeleton,
                style: { width: "35%", height: 22, marginBottom: 20 }
              }
            ),
            /* @__PURE__ */ jsx7(
              "div",
              {
                className: apm_default.skeleton,
                style: { width: "65%", height: 16, marginBottom: 20 }
              }
            ),
            /* @__PURE__ */ jsx7(
              "div",
              {
                className: apm_default.skeleton,
                style: { width: "25%", height: 16 }
              }
            )
          ]
        },
        index
      )),
      !loading && !error && tab !== "Custom" && !total && /* @__PURE__ */ jsxs7("div", { className: alerts_default.empty, children: [
        /* @__PURE__ */ jsx7("h2", { children: "No active automatic alerts" }),
        /* @__PURE__ */ jsx7("p", { children: "Active anomaly incidents will appear here when your application needs attention." })
      ] }),
      !loading && !error && tab === "Custom" && !rules.length && /* @__PURE__ */ jsxs7("div", { className: alerts_default.empty, children: [
        /* @__PURE__ */ jsx7("div", { className: alerts_default.emptyIcon, "aria-hidden": "true", children: "\u2301" }),
        /* @__PURE__ */ jsx7("h2", { children: "No custom rules yet" }),
        /* @__PURE__ */ jsx7("p", { children: "Define a log condition and threshold to investigate your own application signals." }),
        /* @__PURE__ */ jsxs7(
          "button",
          {
            className: alerts_default.create,
            disabled: loading || saving,
            onClick: () => {
              setSaveError("");
              setCreating(true);
            },
            children: [
              /* @__PURE__ */ jsxs7(
                "svg",
                {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "1.7",
                  strokeLinecap: "round",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsx7("path", { d: "M4 7h7m4 0h5M4 17h2m4 0h10" }),
                    /* @__PURE__ */ jsx7("circle", { cx: "13", cy: "7", r: "2" }),
                    /* @__PURE__ */ jsx7("circle", { cx: "8", cy: "17", r: "2" })
                  ]
                }
              ),
              " ",
              "Create Custom Rules"
            ]
          }
        )
      ] })
    ] }),
    pendingDelete && /* @__PURE__ */ jsxs7(
      "dialog",
      {
        ref: deleteDialog,
        className: `${apm_default.logDialog} ${alerts_default.deleteDialog}`,
        "aria-labelledby": "delete-rule-title",
        "aria-describedby": "delete-rule-description",
        onCancel: (event) => {
          if (deletion.current) event.preventDefault();
          else setPendingDelete(null);
        },
        onClose: () => {
          if (!deletion.current) setPendingDelete(null);
        },
        children: [
          /* @__PURE__ */ jsx7("div", { className: apm_default.dialogHeading, children: /* @__PURE__ */ jsx7("h2", { id: "delete-rule-title", children: "Delete custom rule?" }) }),
          /* @__PURE__ */ jsxs7("div", { className: alerts_default.deleteContent, children: [
            /* @__PURE__ */ jsxs7("p", { id: "delete-rule-description", children: [
              "This will permanently delete the custom rule",
              " ",
              /* @__PURE__ */ jsxs7("strong", { children: [
                "\u201C",
                pendingDelete.name,
                "\u201D"
              ] }),
              ". It will stop generating alerts and cannot be restored."
            ] }),
            deleteError && /* @__PURE__ */ jsx7("p", { role: "alert", children: deleteError }),
            /* @__PURE__ */ jsxs7("div", { className: alerts_default.formActions, children: [
              /* @__PURE__ */ jsx7(
                "button",
                {
                  type: "button",
                  autoFocus: true,
                  className: alerts_default.cancel,
                  disabled: deleting !== null,
                  onClick: () => setPendingDelete(null),
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx7(
                "button",
                {
                  type: "button",
                  className: alerts_default.remove,
                  disabled: deleting !== null,
                  onClick: () => removeRule(pendingDelete),
                  children: deleting ? "Deleting\u2026" : "Permanently delete"
                }
              )
            ] })
          ] })
        ]
      }
    ),
    creating && /* @__PURE__ */ jsxs7(
      "dialog",
      {
        ref: dialog,
        className: `${apm_default.logDialog} ${isFreePlan ? alerts_default.upgradeDialog : ""}`,
        "aria-labelledby": "create-alert-title",
        onCancel: () => setCreating(false),
        onClose: () => setCreating(false),
        onClick: (event) => {
          if (event.target !== event.currentTarget) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)
            setCreating(false);
        },
        children: [
          /* @__PURE__ */ jsxs7("div", { className: apm_default.dialogHeading, children: [
            /* @__PURE__ */ jsx7("div", { children: /* @__PURE__ */ jsx7("h2", { id: "create-alert-title", children: isFreePlan ? "Unlock custom rules" : "Create Custom Rules" }) }),
            /* @__PURE__ */ jsx7(
              "button",
              {
                autoFocus: true,
                onClick: () => setCreating(false),
                "aria-label": "Close create alert",
                children: /* @__PURE__ */ jsx7(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.6",
                    strokeLinecap: "round",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx7("path", { d: "m6 6 12 12M18 6 6 18" })
                  }
                )
              }
            )
          ] }),
          isFreePlan ? /* @__PURE__ */ jsxs7("div", { className: alerts_default.upgradeContent, children: [
            /* @__PURE__ */ jsx7("div", { className: alerts_default.upgradeIcon, "aria-hidden": "true", children: /* @__PURE__ */ jsxs7(
              "svg",
              {
                width: "22",
                height: "22",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.6",
                strokeLinecap: "round",
                children: [
                  /* @__PURE__ */ jsx7("rect", { x: "5", y: "10", width: "14", height: "11", rx: "2" }),
                  /* @__PURE__ */ jsx7("path", { d: "M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx7("h3", { children: "Get notified on your terms" }),
            /* @__PURE__ */ jsx7("p", { children: "Custom alert rules are available on paid plans. Upgrade your account to define log conditions and get notified when they match." }),
            /* @__PURE__ */ jsxs7("div", { className: alerts_default.upgradeActions, children: [
              /* @__PURE__ */ jsx7(
                "button",
                {
                  type: "button",
                  className: alerts_default.cancel,
                  onClick: () => setCreating(false),
                  children: "Maybe later"
                }
              ),
              /* @__PURE__ */ jsxs7(
                "a",
                {
                  className: alerts_default.create,
                  href: "#billing",
                  onClick: () => {
                    setCreating(false);
                    onBilling();
                  },
                  children: [
                    "Upgrade plan ",
                    /* @__PURE__ */ jsx7("span", { "aria-hidden": "true", children: "\u2192" })
                  ]
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxs7(
            "form",
            {
              className: alerts_default.form,
              onSubmit: async (event) => {
                event.preventDefault();
                if (submitting.current || draft.conditions.length < 1 || draft.conditions.length > 5 || !draft.name.trim())
                  return;
                submitting.current = true;
                setSaving(true);
                setSaveError("");
                try {
                  const rule = await createCustomRule(cache, {
                    version: 2,
                    name: draft.name.trim(),
                    conditions: draft.conditions.map((condition) => ({
                      ...condition,
                      operator: operatorCodes[condition.operator],
                      value: fields.find(
                        (field) => field.key === condition.field
                      )?.numeric ? Number(condition.value) : condition.value.trim()
                    })),
                    threshold: {
                      count: Number(draft.count),
                      windowMinutes: Number(draft.minutes)
                    }
                  });
                  setRules((current) => [
                    rule,
                    ...current.filter((item) => item.id !== rule.id)
                  ]);
                  setNotice(`Custom rule \u201C${rule.name}\u201D created.`);
                  setDraft(emptyDraft);
                  setTab("Custom");
                  setCreating(false);
                } catch (error2) {
                  setSaveError(
                    error2 instanceof Error ? error2.message : "Unable to save rule"
                  );
                } finally {
                  submitting.current = false;
                  setSaving(false);
                }
              },
              children: [
                /* @__PURE__ */ jsxs7("label", { children: [
                  "Rule name",
                  /* @__PURE__ */ jsx7(
                    "input",
                    {
                      required: true,
                      maxLength: 100,
                      placeholder: "e.g. Checkout errors",
                      value: draft.name,
                      onChange: (event) => setDraft({ ...draft, name: event.target.value })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs7("fieldset", { className: alerts_default.conditions, children: [
                  /* @__PURE__ */ jsx7("legend", { children: "Match log conditions" }),
                  /* @__PURE__ */ jsx7("p", { children: "All conditions must match (AND). Maximum 5 conditions." }),
                  draft.conditions.map((condition, index) => {
                    const field = fields.find(
                      (item) => item.key === condition.field
                    );
                    const update = (change) => setDraft({
                      ...draft,
                      conditions: draft.conditions.map(
                        (item, i) => i === index ? { ...item, ...change } : item
                      )
                    });
                    return /* @__PURE__ */ jsxs7("div", { className: alerts_default.conditionRow, children: [
                      /* @__PURE__ */ jsxs7("label", { children: [
                        "Field",
                        /* @__PURE__ */ jsx7(
                          "select",
                          {
                            value: condition.field,
                            onChange: (event) => update({
                              field: event.target.value,
                              operator: "Equals to",
                              value: ""
                            }),
                            children: fields.map((item) => /* @__PURE__ */ jsx7("option", { value: item.key, children: item.label }, item.key))
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs7("label", { children: [
                        "Operator",
                        /* @__PURE__ */ jsx7(
                          "select",
                          {
                            value: condition.operator,
                            onChange: (event) => update({ operator: event.target.value }),
                            children: (field.numeric ? numberOperators : textOperators).map((operator) => /* @__PURE__ */ jsx7("option", { children: operator }, operator))
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs7("label", { children: [
                        "Value",
                        /* @__PURE__ */ jsx7(
                          "input",
                          {
                            required: true,
                            type: field.numeric ? "number" : "text",
                            step: field.numeric ? "1" : void 0,
                            min: field.numeric ? "0" : void 0,
                            max: condition.field === "SeverityNumber" ? 24 : condition.field === "TraceFlags" ? 255 : void 0,
                            maxLength: 500,
                            placeholder: field.hint,
                            value: condition.value,
                            onChange: (event) => update({ value: event.target.value })
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsx7(
                        "button",
                        {
                          className: alerts_default.removeCondition,
                          type: "button",
                          disabled: draft.conditions.length === 1,
                          "aria-label": `Remove condition ${index + 1}`,
                          onClick: () => setDraft({
                            ...draft,
                            conditions: draft.conditions.filter(
                              (_, i) => i !== index
                            )
                          }),
                          children: /* @__PURE__ */ jsx7(
                            "svg",
                            {
                              width: "15",
                              height: "15",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              stroke: "currentColor",
                              strokeWidth: "1.7",
                              strokeLinecap: "round",
                              "aria-hidden": "true",
                              children: /* @__PURE__ */ jsx7("path", { d: "m6 6 12 12M18 6 6 18" })
                            }
                          )
                        }
                      )
                    ] }, index);
                  }),
                  /* @__PURE__ */ jsx7(
                    "button",
                    {
                      className: alerts_default.addCondition,
                      type: "button",
                      disabled: draft.conditions.length >= 5,
                      onClick: () => setDraft({
                        ...draft,
                        conditions: [
                          ...draft.conditions,
                          {
                            field: "ServiceName",
                            operator: "Equals to",
                            value: ""
                          }
                        ]
                      }),
                      children: "+ Add condition"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs7("div", { className: alerts_default.formGrid, children: [
                  /* @__PURE__ */ jsxs7("label", { children: [
                    "At least this many matches",
                    /* @__PURE__ */ jsx7(
                      "input",
                      {
                        required: true,
                        type: "number",
                        min: "1",
                        max: "1000000",
                        value: draft.count,
                        onChange: (event) => setDraft({ ...draft, count: event.target.value })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs7("label", { children: [
                    "Within minutes",
                    /* @__PURE__ */ jsx7(
                      "input",
                      {
                        required: true,
                        type: "number",
                        min: "1",
                        max: "1440",
                        value: draft.minutes,
                        onChange: (event) => setDraft({ ...draft, minutes: event.target.value })
                      }
                    )
                  ] })
                ] }),
                saveError && /* @__PURE__ */ jsx7("p", { role: "alert", children: saveError }),
                /* @__PURE__ */ jsxs7("div", { className: alerts_default.formActions, children: [
                  /* @__PURE__ */ jsx7(
                    "button",
                    {
                      type: "button",
                      className: alerts_default.cancel,
                      onClick: () => setCreating(false),
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx7(
                    "button",
                    {
                      className: alerts_default.create,
                      type: "submit",
                      disabled: saving,
                      children: saving ? "Creating\u2026" : "Create Rules"
                    }
                  )
                ] })
              ]
            }
          )
        ]
      }
    )
  ] });
}

// src/dashboard/billing.tsx
import { useEffect as useEffect9, useRef as useRef7, useState as useState9 } from "react";

// src/dashboard/billing.module.css
var billing_default = {
  billing: "billing_billing",
  current: "billing_current",
  usage: "billing_usage",
  planName: "billing_planName",
  currentBadge: "billing_currentBadge",
  change: "billing_change",
  usageNumbers: "billing_usageNumbers",
  percent: "billing_percent",
  progress: "billing_progress",
  usageDetails: "billing_usageDetails",
  resetCard: "billing_resetCard",
  calendar: "billing_calendar",
  pricing: "billing_pricing",
  planGrid: "billing_planGrid",
  modalNote: "billing_modalNote",
  planPrice: "billing_planPrice",
  upgradePlan: "billing_upgradePlan",
  currentPlanButton: "billing_currentPlanButton",
  planDetails: "billing_planDetails"
};

// src/dashboard/billing.tsx
import { Fragment as Fragment4, jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var plans = [
  { name: "Free", price: "$0" },
  { name: "Starter", price: "$14.99" },
  { name: "Pro", price: "$29.99" },
  { name: "Business", price: "$59.99" }
];
function Billing({
  data,
  failed
}) {
  const usedGb = data?.usage.usedGb ?? 0, limitGb = data?.usage.limitGb ?? 0;
  const cache = useDashboardCache();
  const [opening, setOpening] = useState9(null);
  const [checkoutError, setCheckoutError] = useState9("");
  const submitting = useRef7(false);
  async function openBilling(plan) {
    if (submitting.current) return;
    submitting.current = true;
    setOpening(plan);
    setCheckoutError("");
    try {
      const portal = plan === "free";
      const response = await fetch(`/api/oneminutelogs/billing/${portal ? "portal" : "checkout"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: portal ? void 0 : JSON.stringify({ plan }),
        signal: AbortSignal.timeout(25e3)
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Unable to open Stripe billing. Please try again.");
      const url2 = new URL(result.url);
      if (url2.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(url2.hostname) || url2.username || url2.password || url2.port) throw Error("Invalid Stripe redirect.");
      cache.invalidate("/api/oneminutelogs/billing/usage");
      window.location.assign(url2.href);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to open Stripe billing. Please try again.");
      submitting.current = false;
      setOpening(null);
    }
  }
  const [choosing, setChoosing] = useState9(false);
  const dialog = useRef7(null);
  const remaining = Math.max(0, limitGb - usedGb);
  const percent = limitGb > 0 ? Math.min(100, Math.round(usedGb / limitGb * 100)) : 0;
  useEffect9(() => {
    if (!choosing) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [choosing]);
  return /* @__PURE__ */ jsxs8("div", { className: `${apm_default.apm} ${billing_default.billing}`, children: [
    /* @__PURE__ */ jsxs8(
      "section",
      {
        className: billing_default.current,
        "aria-labelledby": "current-plan-heading",
        children: [
          /* @__PURE__ */ jsxs8("div", { children: [
            /* @__PURE__ */ jsx8("h2", { id: "current-plan-heading", children: "Current plan" }),
            /* @__PURE__ */ jsxs8("div", { className: billing_default.planName, children: [
              /* @__PURE__ */ jsx8("strong", { children: data?.plan.label ?? (failed ? "Unavailable" : "Loading\u2026") }),
              data && /* @__PURE__ */ jsx8("span", { children: "Active" })
            ] }),
            /* @__PURE__ */ jsx8("p", { children: data ? /* @__PURE__ */ jsxs8(Fragment4, { children: [
              "$",
              data.plan.monthlyPrice.toFixed(2),
              " / month ",
              /* @__PURE__ */ jsx8("span", { children: "\xB7" }),
              " ",
              data.plan.retentionDays,
              " days retention"
            ] }) : "\u2014" })
          ] }),
          /* @__PURE__ */ jsxs8("button", { className: billing_default.change, onClick: () => setChoosing(true), children: [
            /* @__PURE__ */ jsx8(
              "svg",
              {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsx8("path", { d: "M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4" })
              }
            ),
            "Change plan"
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs8(
      "section",
      {
        className: billing_default.usage,
        "aria-labelledby": "telemetry-usage-heading",
        children: [
          /* @__PURE__ */ jsx8("h2", { id: "telemetry-usage-heading", children: "Monthly telemetry usage" }),
          /* @__PURE__ */ jsxs8("div", { className: billing_default.usageNumbers, children: [
            /* @__PURE__ */ jsxs8("div", { children: [
              /* @__PURE__ */ jsx8("strong", { children: data ? `${formatUsedGb(usedGb)} GB` : "\u2014" }),
              /* @__PURE__ */ jsx8("span", { children: data ? ` / ${limitGb} GB` : "" })
            ] }),
            /* @__PURE__ */ jsx8("strong", { className: billing_default.percent, children: data ? formatUsagePercentage(data.usage) : "\u2014" })
          ] }),
          /* @__PURE__ */ jsx8(
            "div",
            {
              className: billing_default.progress,
              role: data ? "progressbar" : void 0,
              "aria-label": "Monthly ingestion allowance used",
              "aria-valuemin": 0,
              "aria-valuemax": 100,
              "aria-valuenow": data ? percent : void 0,
              children: /* @__PURE__ */ jsx8(
                "span",
                {
                  style: {
                    width: `${percent}%`,
                    minWidth: usedGb > 0 ? 4 : 0
                  }
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs8("div", { className: billing_default.usageDetails, children: [
            /* @__PURE__ */ jsx8("span", { children: "Monthly ingestion allowance" }),
            /* @__PURE__ */ jsx8("strong", { children: data ? `${remaining.toFixed(2)} GB remaining` : "\u2014" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs8(
      "section",
      {
        className: billing_default.resetCard,
        "aria-labelledby": "usage-reset-heading",
        children: [
          /* @__PURE__ */ jsx8("div", { className: billing_default.calendar, "aria-hidden": "true", children: /* @__PURE__ */ jsxs8(
            "svg",
            {
              width: "20",
              height: "20",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              children: [
                /* @__PURE__ */ jsx8("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }),
                /* @__PURE__ */ jsx8("path", { d: "M7 3v4m10-4v4M3 11h18m-10 4h4m-4 3h2" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs8("div", { children: [
            /* @__PURE__ */ jsx8("h2", { id: "usage-reset-heading", children: "Usage resets" }),
            /* @__PURE__ */ jsx8("strong", { children: data ? new Date(data.period.end).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC"
            }) : "\u2014" }),
            /* @__PURE__ */ jsx8("p", { children: "Your telemetry usage resets on this date, when your next billing cycle begins and your monthly ingestion allowance renews." })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs8("div", { className: billing_default.pricing, children: [
      /* @__PURE__ */ jsxs8("span", { children: [
        /* @__PURE__ */ jsx8(
          "svg",
          {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            children: /* @__PURE__ */ jsx8("path", { d: "M12 5v15M3 4l9 1 9-1v15l-9 1-9-1V4Z" })
          }
        ),
        "Learn about OML plans and pricing"
      ] }),
      /* @__PURE__ */ jsxs8(
        "a",
        {
          href: "https://www.oneminutelogs.com/#pricing",
          target: "_blank",
          rel: "noopener noreferrer",
          children: [
            "View pricing ",
            /* @__PURE__ */ jsx8("span", { "aria-hidden": "true", children: "\u2197" })
          ]
        }
      )
    ] }),
    choosing && /* @__PURE__ */ jsxs8(
      "dialog",
      {
        ref: dialog,
        className: apm_default.logDialog,
        "aria-labelledby": "choose-plan-heading",
        onCancel: () => setChoosing(false),
        onClose: () => setChoosing(false),
        onClick: (event) => {
          if (event.target !== event.currentTarget) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)
            setChoosing(false);
        },
        children: [
          /* @__PURE__ */ jsxs8("div", { className: apm_default.dialogHeading, children: [
            /* @__PURE__ */ jsx8("div", { children: /* @__PURE__ */ jsx8("h2", { id: "choose-plan-heading", children: "Find your next plan" }) }),
            /* @__PURE__ */ jsx8(
              "button",
              {
                autoFocus: true,
                onClick: () => setChoosing(false),
                "aria-label": "Close plan comparison",
                children: /* @__PURE__ */ jsx8(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.6",
                    strokeLinecap: "round",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx8("path", { d: "m6 6 12 12M18 6 6 18" })
                  }
                )
              }
            )
          ] }),
          checkoutError && /* @__PURE__ */ jsx8("p", { role: "alert", style: { color: "#F87171", padding: "12px 24px", margin: 0 }, children: checkoutError }),
          /* @__PURE__ */ jsx8("div", { className: billing_default.planGrid, children: plans.map((plan) => /* @__PURE__ */ jsxs8("article", { children: [
            /* @__PURE__ */ jsx8("h3", { children: plan.name }),
            /* @__PURE__ */ jsxs8("div", { className: billing_default.planPrice, children: [
              /* @__PURE__ */ jsx8("strong", { children: plan.price }),
              /* @__PURE__ */ jsx8("span", { children: "/ month" })
            ] }),
            plan.name === data?.plan.label ? /* @__PURE__ */ jsx8("span", { className: billing_default.currentPlanButton, children: "Current plan" }) : /* @__PURE__ */ jsx8(
              "button",
              {
                type: "button",
                className: billing_default.upgradePlan,
                disabled: opening !== null || !data,
                onClick: () => void openBilling(plan.name.toLowerCase()),
                children: opening === plan.name.toLowerCase() ? "Opening Stripe\u2026" : plan.name === "Free" ? "Manage subscription" : "Upgrade"
              }
            ),
            /* @__PURE__ */ jsx8(
              "a",
              {
                className: billing_default.planDetails,
                href: "https://www.oneminutelogs.com/#pricing",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "View plan details \u2197"
              }
            )
          ] }, plan.name)) })
        ]
      }
    )
  ] });
}

// src/dashboard/realtime-logs.tsx
import { useEffect as useEffect10, useRef as useRef8, useState as useState10 } from "react";

// src/dashboard/realtime-logs.module.css
var realtime_logs_default = {
  logs: "realtime_logs_logs",
  groupBar: "realtime_logs_groupBar",
  active: "realtime_logs_active",
  reset: "realtime_logs_reset",
  snapshot: "realtime_logs_snapshot",
  recordCount: "realtime_logs_recordCount",
  filters: "realtime_logs_filters",
  footer: "realtime_logs_footer",
  tail: "realtime_logs_tail",
  columnHead: "realtime_logs_columnHead",
  logRow: "realtime_logs_logRow",
  service: "realtime_logs_service",
  duration: "realtime_logs_duration",
  message: "realtime_logs_message",
  subgroupBar: "realtime_logs_subgroupBar",
  chatComposer: "realtime_logs_chatComposer",
  askIcon: "realtime_logs_askIcon",
  upgradeLink: "realtime_logs_upgradeLink",
  chatNotice: "realtime_logs_chatNotice",
  tailPanel: "realtime_logs_tailPanel",
  askHelp: "realtime_logs_askHelp",
  helpButton: "realtime_logs_helpButton",
  helpTooltip: "realtime_logs_helpTooltip",
  liveStatus: "realtime_logs_liveStatus",
  historyStatus: "realtime_logs_historyStatus",
  skeletonRow: "realtime_logs_skeletonRow",
  skeletonBar: "realtime_logs_skeletonBar",
  logSkeletonShimmer: "realtime_logs_logSkeletonShimmer",
  skeletonMessage: "realtime_logs_skeletonMessage"
};

// src/dashboard/realtime-logs.tsx
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var groups = Object.values(logGroups);
function RealtimeLogs({ onBilling, isActive = true }) {
  const [group, setGroup] = useState10("All");
  const [subgroup, setSubgroup] = useState10("All subgroups");
  const [severity, setSeverity] = useState10("All levels");
  const [query, setQuery] = useState10("");
  const [question, setQuestion] = useState10("");
  const [questionNotice, setQuestionNotice] = useState10("");
  const [selected, setSelected] = useState10(null);
  const dialog = useRef8(null);
  const {
    attachTail,
    logs: rawLogs,
    state: streamState,
    cursor,
    loadingOlder,
    historyError,
    newCount,
    retrySeconds,
    onScroll,
    loadOlder,
    showLatest,
    reconnect
  } = useRealtimeLogs(void 0, "7d", isActive);
  const logs = rawLogs.map(presentLog);
  useEffect10(() => {
    if (!isActive) setSelected(null);
  }, [isActive]);
  useEffect10(() => {
    if (!selected) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [selected]);
  const inGroup = logs.filter(
    (log) => group === "All" || (group === "Unclassified" ? log.classification === "unclassified" : log.parentGroup === group)
  );
  const subgroups = Array.from(
    new Map(
      inGroup.filter((log) => log.classification === "matched").map((log) => [log.subgroupId, log.subgroupName])
    ).entries()
  );
  const filtered = inGroup.filter(
    (log) => (subgroup === "All subgroups" || log.subgroupId === subgroup) && (severity === "All levels" || log.severity === severity) && `${log.body} ${log.service} ${log.traceId ?? ""}`.toLowerCase().includes(query.toLowerCase().trim())
  );
  function reset() {
    setGroup("All");
    setSubgroup("All subgroups");
    setSeverity("All levels");
    setQuery("");
  }
  return /* @__PURE__ */ jsxs9("div", { className: `${apm_default.apm} ${realtime_logs_default.logs}`, children: [
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: realtime_logs_default.groupBar,
        role: "group",
        "aria-label": "Parent log group",
        children: ["All", ...groups, "Unclassified"].map((name) => /* @__PURE__ */ jsxs9(
          "button",
          {
            "aria-pressed": group === name,
            className: group === name ? realtime_logs_default.active : "",
            onClick: () => {
              setGroup(name);
              setSubgroup("All subgroups");
            },
            children: [
              /* @__PURE__ */ jsx9("span", { children: name }),
              /* @__PURE__ */ jsx9("small", { children: streamState === "loading" ? "\u2014" : logs.filter(
                (log) => name === "All" || (name === "Unclassified" ? log.classification === "unclassified" : log.parentGroup === name)
              ).length })
            ]
          },
          name
        ))
      }
    ),
    /* @__PURE__ */ jsxs9(
      "section",
      {
        className: `${apm_default.panel} ${realtime_logs_default.tailPanel}`,
        "aria-label": "Log tail",
        children: [
          /* @__PURE__ */ jsxs9("div", { className: realtime_logs_default.liveStatus, role: "status", children: [
            /* @__PURE__ */ jsxs9("span", { children: [
              "Last 7 days \xB7",
              " ",
              streamState === "loading" ? "Loading logs\u2026" : streamState === "live" ? "Live" : streamState === "paused" ? "Paused while tab is inactive" : "Disconnected"
            ] }),
            streamState === "error" && /* @__PURE__ */ jsx9(
              "button",
              {
                className: realtime_logs_default.reset,
                disabled: retrySeconds > 0,
                onClick: reconnect,
                children: retrySeconds > 0 ? `Reconnect in ${retrySeconds}s` : "Reconnect"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs9("div", { className: realtime_logs_default.filters, children: [
            /* @__PURE__ */ jsxs9("label", { className: apm_default.search, children: [
              /* @__PURE__ */ jsx9("span", { className: apm_default.srOnly, children: "Search message, service or Trace ID" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  value: query,
                  onChange: (event) => setQuery(event.target.value),
                  placeholder: "Search message, service or trace\u2026"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs9("label", { className: apm_default.selectLabel, children: [
              /* @__PURE__ */ jsx9("span", { className: apm_default.srOnly, children: "Severity" }),
              /* @__PURE__ */ jsxs9(
                "select",
                {
                  value: severity,
                  onChange: (event) => setSeverity(event.target.value),
                  children: [
                    /* @__PURE__ */ jsx9("option", { children: "All levels" }),
                    /* @__PURE__ */ jsx9("option", { children: "FATAL" }),
                    /* @__PURE__ */ jsx9("option", { children: "ERROR" }),
                    /* @__PURE__ */ jsx9("option", { children: "WARN" }),
                    /* @__PURE__ */ jsx9("option", { children: "INFO" }),
                    /* @__PURE__ */ jsx9("option", { children: "DEBUG" }),
                    /* @__PURE__ */ jsx9("option", { children: "TRACE" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx9("button", { className: realtime_logs_default.reset, onClick: reset, children: "Reset filters" }),
            /* @__PURE__ */ jsx9("span", { className: realtime_logs_default.recordCount, children: streamState === "loading" ? "Loading records\u2026" : `${filtered.length} / ${logs.length} loaded logs` }),
            /* @__PURE__ */ jsx9("button", { className: realtime_logs_default.reset, onClick: showLatest, children: newCount > 0 ? `${newCount} new logs \u2193` : "Latest \u2193" })
          ] }),
          group !== "All" && subgroups.length > 0 && /* @__PURE__ */ jsx9(
            "div",
            {
              className: `${realtime_logs_default.groupBar} ${realtime_logs_default.subgroupBar}`,
              role: "group",
              "aria-label": "Log subgroup",
              children: [["All subgroups", "All subgroups"], ...subgroups].map(
                ([id, name]) => /* @__PURE__ */ jsxs9(
                  "button",
                  {
                    "aria-pressed": subgroup === id,
                    className: subgroup === id ? realtime_logs_default.active : "",
                    onClick: (event) => {
                      setSubgroup(id);
                      event.currentTarget.scrollIntoView({
                        block: "nearest",
                        inline: "nearest",
                        behavior: "smooth"
                      });
                    },
                    children: [
                      /* @__PURE__ */ jsx9("span", { children: name }),
                      /* @__PURE__ */ jsx9("small", { children: id === "All subgroups" ? inGroup.length : inGroup.filter((log) => log.subgroupId === id).length })
                    ]
                  },
                  id
                )
              )
            }
          ),
          /* @__PURE__ */ jsxs9(
            "div",
            {
              className: realtime_logs_default.tail,
              ref: attachTail,
              tabIndex: 0,
              "aria-label": "Scrollable logs, oldest first",
              onScroll,
              children: [
                /* @__PURE__ */ jsxs9("div", { className: realtime_logs_default.columnHead, children: [
                  /* @__PURE__ */ jsx9("span", { children: "Time \xB7 UTC" }),
                  /* @__PURE__ */ jsx9("span", { children: "Level" }),
                  /* @__PURE__ */ jsx9("span", { children: "Service" }),
                  /* @__PURE__ */ jsx9("span", { children: "Message / Group" }),
                  /* @__PURE__ */ jsx9("span", { children: "Duration" })
                ] }),
                cursor && /* @__PURE__ */ jsx9("div", { className: realtime_logs_default.historyStatus, children: /* @__PURE__ */ jsx9(
                  "button",
                  {
                    className: realtime_logs_default.reset,
                    disabled: loadingOlder,
                    onClick: () => void loadOlder(),
                    children: loadingOlder ? "Loading older logs\u2026" : "Scroll up to load 50 older logs"
                  }
                ) }),
                historyError && /* @__PURE__ */ jsxs9("div", { className: realtime_logs_default.historyStatus, role: "alert", children: [
                  "Older logs could not be loaded.",
                  " ",
                  /* @__PURE__ */ jsx9("button", { className: realtime_logs_default.reset, onClick: () => void loadOlder(), children: "Try again" })
                ] }),
                streamState !== "loading" && !cursor && /* @__PURE__ */ jsx9("div", { className: realtime_logs_default.historyStatus, children: "Start of this 7-day history" }),
                streamState === "loading" ? Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ jsxs9(
                  "div",
                  {
                    className: `${realtime_logs_default.logRow} ${realtime_logs_default.skeletonRow}`,
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsx9("span", { className: realtime_logs_default.skeletonBar, style: { width: 70 } }),
                      /* @__PURE__ */ jsx9("span", { className: realtime_logs_default.skeletonBar, style: { width: 28 } }),
                      /* @__PURE__ */ jsx9(
                        "span",
                        {
                          className: realtime_logs_default.skeletonBar,
                          style: { width: [62, 78, 54, 72][i % 4] }
                        }
                      ),
                      /* @__PURE__ */ jsxs9(
                        "span",
                        {
                          className: realtime_logs_default.skeletonMessage,
                          style: { width: ["64%", "48%", "76%", "56%", "40%"][i % 5] },
                          children: [
                            /* @__PURE__ */ jsx9("span", { className: realtime_logs_default.skeletonBar }),
                            /* @__PURE__ */ jsx9(
                              "span",
                              {
                                className: realtime_logs_default.skeletonBar,
                                style: {
                                  width: ["56%", "72%", "44%"][i % 3],
                                  height: 6,
                                  opacity: 0.55
                                }
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx9(
                        "span",
                        {
                          className: realtime_logs_default.skeletonBar,
                          style: { width: 38, justifySelf: "end" }
                        }
                      )
                    ]
                  },
                  i
                )) : filtered.length ? filtered.map((log) => /* @__PURE__ */ jsxs9(
                  "button",
                  {
                    className: realtime_logs_default.logRow,
                    onClick: () => setSelected(log),
                    "aria-label": `Inspect log: ${log.body}`,
                    children: [
                      /* @__PURE__ */ jsx9("time", { children: log.timestamp.slice(11, 23) }),
                      /* @__PURE__ */ jsx9("strong", { className: apm_default[log.severity.toLowerCase()], children: log.severity }),
                      /* @__PURE__ */ jsx9("span", { className: realtime_logs_default.service, children: log.service }),
                      /* @__PURE__ */ jsxs9("span", { className: realtime_logs_default.message, children: [
                        /* @__PURE__ */ jsx9("span", { children: log.body }),
                        /* @__PURE__ */ jsx9("small", { children: log.classification === "unclassified" ? "Unclassified" : `${log.parentGroup} / ${log.subgroupName}` })
                      ] }),
                      /* @__PURE__ */ jsx9("span", { className: realtime_logs_default.duration, children: log.durationMs === void 0 ? "\u2014" : `${log.durationMs.toFixed(2)} ms` })
                    ]
                  },
                  log.id
                )) : /* @__PURE__ */ jsxs9("div", { className: apm_default.empty, children: [
                  streamState === "error" && logs.length === 0 ? "Logs unavailable. Reconnect to try again." : logs.length === 0 ? "No logs in the last 7 days. Waiting for new logs\u2026" : "No loaded logs match these filters.",
                  logs.length > 0 && /* @__PURE__ */ jsx9("button", { onClick: reset, children: "Clear filters" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs9("div", { className: realtime_logs_default.footer, children: [
            /* @__PURE__ */ jsx9("span", { children: "Oldest \u2192 newest \xB7 Click any log for full JSON" }),
            /* @__PURE__ */ jsx9("span", { children: "Groups and filters apply to loaded logs" })
          ] }),
          /* @__PURE__ */ jsxs9(
            "form",
            {
              className: realtime_logs_default.chatComposer,
              onSubmit: (event) => {
                event.preventDefault();
                if (!question.trim()) return;
                setQuestionNotice(
                  "AI chat is not connected in this preview. Your question has not been sent."
                );
              },
              children: [
                /* @__PURE__ */ jsx9("a", { className: realtime_logs_default.upgradeLink, href: "#billing", onClick: onBilling, children: "Upgrade your account to use Ask OML" }),
                /* @__PURE__ */ jsx9("label", { className: apm_default.srOnly, htmlFor: "log-question", children: "Ask a question about these logs" }),
                /* @__PURE__ */ jsxs9(
                  "svg",
                  {
                    className: realtime_logs_default.askIcon,
                    width: "18",
                    height: "18",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.5",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsx9("path", { d: "m10 5 2.2 5.8L18 13l-5.8 2.2L10 21l-2.2-5.8L2 13l5.8-2.2L10 5Z" }),
                      /* @__PURE__ */ jsx9("path", { d: "m19 2 .9 2.1L22 5l-2.1.9L19 8l-.9-2.1L16 5l2.1-.9L19 2Z" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx9(
                  "input",
                  {
                    id: "log-question",
                    disabled: true,
                    value: question,
                    maxLength: 4e3,
                    onChange: (event) => {
                      setQuestion(event.target.value);
                      setQuestionNotice("");
                    },
                    placeholder: "Ask OML to analyze logs, investigate errors, or calculate metrics\u2026",
                    autoComplete: "off"
                  }
                ),
                /* @__PURE__ */ jsxs9("span", { className: realtime_logs_default.askHelp, children: [
                  /* @__PURE__ */ jsx9(
                    "button",
                    {
                      type: "button",
                      className: realtime_logs_default.helpButton,
                      "aria-label": "What can Ask OML do?",
                      "aria-describedby": "ask-oml-help",
                      children: /* @__PURE__ */ jsxs9(
                        "svg",
                        {
                          width: "16",
                          height: "16",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "1.7",
                          strokeLinecap: "round",
                          "aria-hidden": "true",
                          children: [
                            /* @__PURE__ */ jsx9("circle", { cx: "12", cy: "12", r: "9" }),
                            /* @__PURE__ */ jsx9("path", { d: "M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.6-2.3 1.8-2.3 3.4" }),
                            /* @__PURE__ */ jsx9(
                              "circle",
                              {
                                cx: "12",
                                cy: "16.8",
                                r: ".8",
                                fill: "currentColor",
                                stroke: "none"
                              }
                            )
                          ]
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxs9(
                    "span",
                    {
                      id: "ask-oml-help",
                      role: "tooltip",
                      className: realtime_logs_default.helpTooltip,
                      children: [
                        /* @__PURE__ */ jsx9("strong", { children: "What can Ask OML do?" }),
                        /* @__PURE__ */ jsx9("span", { children: "Explore and summarize logs, calculate metrics, compare time periods, and investigate incidents using your application's telemetry." }),
                        /* @__PURE__ */ jsx9("span", { children: 'Example: "Why did checkout errors increase in the last hour?"' }),
                        /* @__PURE__ */ jsx9(
                          "a",
                          {
                            href: "https://www.oneminutelogs.com/docs",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: "Learn more \u2197"
                          }
                        )
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx9("button", { type: "submit", disabled: true, "aria-label": "Send question", children: /* @__PURE__ */ jsx9(
                  "svg",
                  {
                    width: "17",
                    height: "17",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.8",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx9("path", { d: "M12 19V5m-6 6 6-6 6 6" })
                  }
                ) })
              ]
            }
          ),
          questionNotice && /* @__PURE__ */ jsx9("p", { className: realtime_logs_default.chatNotice, role: "status", children: questionNotice })
        ]
      }
    ),
    selected && /* @__PURE__ */ jsxs9(
      "dialog",
      {
        ref: dialog,
        className: apm_default.logDialog,
        "aria-labelledby": "tail-log-heading",
        onCancel: () => setSelected(null),
        onClose: () => setSelected(null),
        onClick: (event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
            setSelected(null);
        },
        children: [
          /* @__PURE__ */ jsxs9("div", { className: apm_default.dialogHeading, children: [
            /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx9("h2", { id: "tail-log-heading", children: "Full log record" }),
              /* @__PURE__ */ jsxs9("p", { children: [
                selected.service,
                " \xB7 ",
                selected.environment,
                " \xB7",
                " ",
                selected.timestamp
              ] })
            ] }),
            /* @__PURE__ */ jsx9(
              "button",
              {
                autoFocus: true,
                "aria-label": "Close log details",
                onClick: () => setSelected(null),
                children: /* @__PURE__ */ jsx9(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "1.6",
                    strokeLinecap: "round",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx9("path", { d: "m6 6 12 12M18 6 6 18" })
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsx9("pre", { className: apm_default.logJson, tabIndex: 0, children: JSON.stringify(selected.record, null, 2) })
        ]
      }
    )
  ] });
}

// src/dashboard/page.tsx
import { Fragment as Fragment5, jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
var sections = [
  {
    name: "Overview",
    icon: "overview",
    description: "Your application health, at a glance."
  },
  {
    name: "API Performance",
    icon: "apm",
    description: "Your API endpoints, response times, and request failures."
  },
  {
    name: "Browser Health",
    icon: "rum",
    description: "Browser health, errors, and diagnostic evidence."
  },
  {
    name: "Realtime Logs",
    icon: "logs",
    description: "Follow what\u2019s happening in your application."
  },
  {
    name: "Incidents",
    icon: "incidents",
    description: "Investigate unusual behavior and ongoing issues."
  },
  {
    name: "Alerts",
    icon: "alerts",
    description: "Stay informed when your application needs attention, or set up custom rules for the notifications that matter to you."
  },
  {
    name: "Billing",
    icon: "billing",
    description: "Manage your plan and telemetry allowance."
  }
];
function Icon({ name, className }) {
  const paths = {
    overview: /* @__PURE__ */ jsxs10(Fragment5, { children: [
      /* @__PURE__ */ jsx10("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }),
      /* @__PURE__ */ jsx10("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }),
      /* @__PURE__ */ jsx10("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }),
      /* @__PURE__ */ jsx10("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1.5" })
    ] }),
    apm: /* @__PURE__ */ jsx10("path", { d: "M2 12h4l3-8 6 16 3-8h4" }),
    rum: /* @__PURE__ */ jsxs10(Fragment5, { children: [
      /* @__PURE__ */ jsx10("rect", { x: "3", y: "4", width: "18", height: "13", rx: "2" }),
      /* @__PURE__ */ jsx10("path", { d: "M8 21h8M12 17v4M3 8h18" })
    ] }),
    logs: /* @__PURE__ */ jsxs10(Fragment5, { children: [
      /* @__PURE__ */ jsx10("path", { d: "m4 6 4 4-4 4M12 14h8M4 20h16" }),
      /* @__PURE__ */ jsx10("circle", { cx: "20", cy: "5", r: "1", fill: "currentColor", stroke: "none" })
    ] }),
    incidents: /* @__PURE__ */ jsxs10(Fragment5, { children: [
      /* @__PURE__ */ jsx10("path", { d: "m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.2l-8-14a2 2 0 0 0-3.4 0Z" }),
      /* @__PURE__ */ jsx10("path", { d: "M12 9v4M12 17h.01" })
    ] }),
    alerts: /* @__PURE__ */ jsx10(Fragment5, { children: /* @__PURE__ */ jsx10("path", { d: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" }) }),
    billing: /* @__PURE__ */ jsxs10(Fragment5, { children: [
      /* @__PURE__ */ jsx10("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
      /* @__PURE__ */ jsx10("path", { d: "M3 10h18M7 15h3" })
    ] }),
    arrow: /* @__PURE__ */ jsx10("path", { d: "M5 12h14m-5-5 5 5-5 5" })
  };
  return /* @__PURE__ */ jsx10(
    "svg",
    {
      className,
      width: "19",
      height: "19",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: paths[name]
    }
  );
}
function Page({ styling }) {
  const cache = useDashboardCache();
  const [incidentKey, setIncidentKey] = useState11();
  const [apiEndpoint, setApiEndpoint] = useState11(null);
  const [active, setActive] = useState11(
    () => typeof window === "undefined" ? sections[0] : sections.find((section) => section.icon === window.location.hash.slice(1)) ?? sections[0]
  );
  useEffect11(() => {
    const restoreSection = () => setActive(sections.find((section) => section.icon === window.location.hash.slice(1)) ?? sections[0]);
    window.addEventListener("hashchange", restoreSection);
    window.addEventListener("popstate", restoreSection);
    return () => {
      window.removeEventListener("hashchange", restoreSection);
      window.removeEventListener("popstate", restoreSection);
    };
  }, []);
  const [rumVisited, setRumVisited] = useState11(active.name === "Browser Health");
  useEffect11(() => {
    if (active.name === "Browser Health") setRumVisited(true);
  }, [active]);
  const [logsVisited, setLogsVisited] = useState11(active.name === "Realtime Logs");
  useEffect11(() => {
    if (active.name === "Realtime Logs") setLogsVisited(true);
  }, [active]);
  const [billingUsage, setBillingUsage] = useState11(null);
  const [usageFailed, setUsageFailed] = useState11(false);
  useEffect11(() => {
    let active2 = true;
    fetchBillingUsage(cache).then((data) => {
      if (active2) setBillingUsage(data);
    }).catch(() => {
      if (active2) setUsageFailed(true);
    });
    return () => {
      active2 = false;
    };
  }, []);
  const percentage = billingUsage ? Math.min(100, billingUsage.usage.percentage) : 0;
  const select = (section) => {
    setActive(section);
    if (window.location.hash !== `#${section.icon}`) window.history.pushState(window.history.state, "", `#${section.icon}`);
  };
  return /* @__PURE__ */ jsxs10("div", { className: `${dashboard_default.shell} oml-dashboard__shell`, style: styling?.shell, children: [
    /* @__PURE__ */ jsxs10("aside", { className: `${dashboard_default.sidebar} oml-dashboard__sidebar`, style: styling?.sidebar, "aria-label": "OneMinute Logs sidebar", children: [
      /* @__PURE__ */ jsx10("nav", { className: `${dashboard_default.navigation} oml-dashboard__navigation`, style: styling?.navigation, "aria-label": "Main navigation", children: sections.map((section) => /* @__PURE__ */ jsxs10(
        "a",
        {
          href: `#${section.icon}`,
          onClick: (event) => {
            event.preventDefault();
            select(section);
          },
          style: { ...styling?.navItem, ...active.name === section.name ? styling?.activeNavItem : {} },
          className: `${dashboard_default.navItem} oml-dashboard__nav-item ${active.name === section.name ? dashboard_default.active : ""}`,
          "aria-current": active.name === section.name ? "page" : void 0,
          children: [
            /* @__PURE__ */ jsx10(Icon, { name: section.icon }),
            /* @__PURE__ */ jsx10("span", { children: section.name }),
            active.name === section.name && /* @__PURE__ */ jsx10("span", { className: dashboard_default.activeDot })
          ]
        },
        section.name
      )) }),
      /* @__PURE__ */ jsx10("div", { className: `${dashboard_default.sidebarBottom} oml-dashboard__sidebar-footer`, style: styling?.sidebarFooter, children: /* @__PURE__ */ jsxs10("section", { className: `${dashboard_default.usage} oml-dashboard__usage`, style: styling?.usage, "aria-label": "Plan usage", children: [
        /* @__PURE__ */ jsxs10("div", { className: dashboard_default.usageHeading, children: [
          /* @__PURE__ */ jsx10("span", { children: "Monthly usage" }),
          /* @__PURE__ */ jsx10("span", { className: dashboard_default.plan, children: billingUsage ? `${billingUsage.plan.label} plan` : usageFailed ? "Unavailable" : "Loading\u2026" })
        ] }),
        /* @__PURE__ */ jsxs10("div", { className: dashboard_default.usageNumbers, children: [
          /* @__PURE__ */ jsx10("strong", { children: billingUsage ? /* @__PURE__ */ jsxs10(Fragment5, { children: [
            formatUsedGb(billingUsage.usage.usedGb),
            " ",
            /* @__PURE__ */ jsxs10("span", { children: [
              "/ ",
              billingUsage.usage.limitGb,
              " GB"
            ] })
          ] }) : usageFailed ? "\u2014" : /* @__PURE__ */ jsx10("span", { className: apm_default.skeleton, style: { width: 100 } }) }),
          /* @__PURE__ */ jsx10("span", { children: billingUsage ? formatUsagePercentage(billingUsage.usage) : "\u2014" })
        ] }),
        /* @__PURE__ */ jsx10(
          "div",
          {
            className: dashboard_default.progress,
            role: billingUsage ? "progressbar" : void 0,
            "aria-label": "Monthly telemetry allowance consumed",
            "aria-valuenow": billingUsage ? percentage : void 0,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            children: /* @__PURE__ */ jsx10(
              "span",
              {
                style: {
                  width: `${percentage}%`,
                  minWidth: billingUsage && billingUsage.usage.usedGb > 0 ? 4 : 0
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsx10("p", { className: dashboard_default.usageNote, children: "of your monthly ingestion allowance" }),
        /* @__PURE__ */ jsxs10(
          "a",
          {
            className: dashboard_default.upgrade,
            href: "#billing",
            onClick: (event) => {
              event.preventDefault();
              select(sections[6]);
            },
            children: [
              "Upgrade plan",
              /* @__PURE__ */ jsx10(Icon, { name: "arrow" })
            ]
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsx10("div", { className: `${dashboard_default.content} oml-dashboard__content`, style: styling?.content, children: /* @__PURE__ */ jsxs10(
      "main",
      {
        className: `${dashboard_default.main} oml-dashboard__main ${active.name === "Realtime Logs" ? dashboard_default.tailMain : ""}`,
        style: styling?.main,
        id: active.icon,
        children: [
          active.name !== "Incidents" && /* @__PURE__ */ jsxs10("div", { className: `${dashboard_default.pageHeading} oml-dashboard__page-heading`, style: styling?.pageHeading, children: [
            /* @__PURE__ */ jsx10("h1", { style: styling?.title, children: active.name }),
            /* @__PURE__ */ jsx10("p", { style: styling?.description, children: active.name === "Alerts" ? /* @__PURE__ */ jsxs10(Fragment5, { children: [
              "Stay informed when your application needs attention.",
              /* @__PURE__ */ jsx10("br", {}),
              "Set up custom rules for the notifications that matter to you."
            ] }) : active.description })
          ] }),
          active.name === "Overview" ? /* @__PURE__ */ jsx10(
            Overview,
            {
              onNavigate: (name) => {
                const section = sections.find((item) => item.name === name);
                if (section) select(section);
              }
            }
          ) : active.name === "API Performance" ? /* @__PURE__ */ jsx10(Apm, { openEndpoint: apiEndpoint }) : active.name === "Browser Health" ? null : active.name === "Realtime Logs" ? null : active.name === "Incidents" ? /* @__PURE__ */ jsx10(Incidents, { initialConditionKey: incidentKey }) : active.name === "Alerts" ? /* @__PURE__ */ jsx10(
            Alerts,
            {
              isFreePlan: !billingUsage || billingUsage.plan.name === "free",
              onBilling: () => select(sections[6]),
              onIncident: (key) => {
                setIncidentKey(key);
                select(sections[4]);
              }
            }
          ) : /* @__PURE__ */ jsx10(Billing, { data: billingUsage, failed: usageFailed }),
          (rumVisited || active.name === "Browser Health") && /* @__PURE__ */ jsx10("div", { hidden: active.name !== "Browser Health", style: { display: active.name === "Browser Health" ? "block" : "none" }, children: /* @__PURE__ */ jsx10(Rum, { isActive: active.name === "Browser Health", onOpenApiEndpoint: (endpoint) => {
            setApiEndpoint({ method: endpoint.method, route: endpoint.endpoint });
            select(sections[1]);
          } }) }),
          (logsVisited || active.name === "Realtime Logs") && /* @__PURE__ */ jsx10("div", { hidden: active.name !== "Realtime Logs", style: { display: active.name === "Realtime Logs" ? "flex" : "none", flex: 1, minHeight: 0 }, children: /* @__PURE__ */ jsx10(RealtimeLogs, { isActive: active.name === "Realtime Logs", onBilling: () => select(sections[6]) }) })
        ]
      }
    ) })
  ] });
}

// src/admin.ts
import { createElement as h, useEffect as useEffect12, useRef as useRef9, useState as useState12, useId as useId2 } from "react";
function OMLAdminGate({ children, basePath = "/api/oneminutelogs" }) {
  const [requestCache] = useState12(() => new DashboardRequestCache());
  const [authenticated, setAuthenticated] = useState12(false);
  const [checking, setChecking] = useState12(true);
  const [password, setPassword] = useState12("");
  const [error, setError] = useState12("");
  const [busy, setBusy] = useState12(false);
  const [visible, setVisible] = useState12(false);
  const id = useId2();
  const dialog = useRef9(null);
  const base = basePath.replace(/\/$/, "");
  useEffect12(() => {
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
  useEffect12(() => {
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
  if (checking) return h("div", { role: "status", style: { minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--oml-color-000)", color: "var(--oml-color-a3a3a3)", font: "14px Arial, sans-serif" } }, "Checking admin access\u2026");
  if (authenticated) return h("div", { style: { background: "var(--oml-color-000)", color: "var(--oml-color-ededed)", minHeight: "100dvh" } }, h(DashboardCacheContext.Provider, { value: requestCache }, children));
  return h(
    "div",
    { style: { minHeight: "100dvh", background: "var(--oml-color-000)" } },
    h("style", null, `
      .oml-admin-dialog::backdrop { background: rgba(0,0,0,.88); backdrop-filter: blur(6px); }
      .oml-admin-dialog * { box-sizing: border-box; }
      .oml-admin-dialog .oml-admin-input:focus { border-color: var(--oml-color-3b82f6) !important; box-shadow: 0 0 0 3px rgba(59,130,246,.14); }
      .oml-admin-dialog button:focus-visible { outline: 2px solid var(--oml-color-60a5fa); outline-offset: 3px; }
      .oml-admin-dialog .oml-admin-submit:not(:disabled):hover { background: var(--oml-color-2575ff) !important; }
      .oml-admin-dialog .oml-admin-reveal:hover { color: var(--oml-color-ededed) !important; }
      .oml-admin-dialog .oml-admin-submit:disabled { opacity: .5; cursor: not-allowed !important; }
      @media (max-width: 480px) { .oml-admin-dialog .oml-admin-form { padding: 28px 24px !important; } }
    `),
    h(
      "dialog",
      {
        ref: dialog,
        className: "oml-admin-dialog",
        "aria-labelledby": `${id}-heading`,
        "aria-describedby": `${id}-description`,
        onCancel: (event) => event.preventDefault(),
        style: { position: "fixed", inset: 0, margin: "auto", width: 440, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100dvh - 32px)", overflowY: "auto", boxSizing: "border-box", border: "1px solid var(--oml-color-292929)", borderRadius: 16, padding: 0, background: "var(--oml-color-0b0b0b)", color: "var(--oml-color-ededed)", colorScheme: "var(--oml-color-scheme)", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 14, lineHeight: 1.5, boxShadow: "0 24px 100px rgba(0,0,0,.65)" }
      },
      h(
        "form",
        { onSubmit: login, "aria-busy": busy, className: "oml-admin-form", style: { padding: "36px 36px 32px", margin: 0 } },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 11, marginBottom: 32 } },
          h(
            "svg",
            { width: 36, height: 36, viewBox: "0 0 512 512", fill: "none", "aria-hidden": true },
            h("rect", { width: 512, height: 512, rx: 112, fill: "var(--oml-color-111)", stroke: "var(--oml-color-303030)", strokeWidth: 12 }),
            h("path", { d: "M214 48 108 256h116l-65 208 245-256H286L358 48H214Z", fill: "var(--oml-color-66d9b5)", stroke: "var(--oml-color-a7f3d0)", strokeWidth: 18, strokeLinejoin: "round" })
          ),
          h("span", { style: { fontSize: 17, fontWeight: 600, letterSpacing: "-.4px" } }, "OneMinute Logs")
        ),
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 7, color: "var(--oml-color-737373)", fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", marginBottom: 10 } },
          h("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "var(--oml-color-66d9b5)" } }),
          "ADMIN ACCESS"
        ),
        h("h2", { id: `${id}-heading`, style: { margin: "0 0 10px", fontSize: 26, fontWeight: 600, letterSpacing: "-.9px", lineHeight: 1.2 } }, "Open your dashboard"),
        h("p", { id: `${id}-description`, style: { margin: "0 0 28px", color: "var(--oml-color-929292)", fontSize: 13, lineHeight: 1.7 } }, "Enter your admin password to access logs, incidents, and application health."),
        h("label", { htmlFor: `${id}-password`, style: { display: "block", marginBottom: 9, fontSize: 12, fontWeight: 500, color: "var(--oml-color-d4d4d4)" } }, "Admin password"),
        h(
          "div",
          { style: { position: "relative" } },
          h("input", {
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
          h(
            "button",
            {
              type: "button",
              className: "oml-admin-reveal",
              "aria-label": visible ? "Hide password" : "Show password",
              "aria-pressed": visible,
              onClick: () => setVisible(!visible),
              style: { position: "absolute", right: 4, top: 4, width: 38, height: 38, display: "grid", placeItems: "center", background: "transparent", border: 0, borderRadius: 5, color: "var(--oml-color-737373)", cursor: "pointer", padding: 0 }
            },
            h(
              "svg",
              { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
              h("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" }),
              h("circle", { cx: 12, cy: 12, r: 3 }),
              visible && h("path", { d: "m3 3 18 18" })
            )
          )
        ),
        error && h("div", { id: `${id}-error`, role: "alert", style: { marginTop: 12, padding: "10px 12px", borderRadius: 7, border: "1px solid var(--oml-color-472a28)", background: "var(--oml-color-201312)", color: "var(--oml-color-f2a59e)", fontSize: 12, lineHeight: 1.6 } }, error),
        h("p", { id: `${id}-help`, style: { margin: "10px 0 24px", color: "var(--oml-color-737373)", fontSize: 11, lineHeight: 1.6 } }, "Use the password saved in your project\u2019s environment file."),
        h(
          "button",
          {
            type: "submit",
            className: "oml-admin-submit",
            disabled: busy || [...password].length < 6,
            style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", height: 44, border: "1px solid var(--oml-color-367dff)", borderRadius: 8, background: "var(--oml-color-0066ff)", color: "var(--oml-color-fff)", font: "inherit", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background .15s, opacity .15s" }
          },
          busy ? "Unlocking dashboard\u2026" : "Unlock dashboard",
          !busy && h("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, h("path", { d: "M5 12h14m-5-5 5 5-5 5" }))
        )
      ),
      h(
        "div",
        { style: { padding: "14px 24px", borderTop: "1px solid var(--oml-color-202020)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "var(--oml-color-666)", fontSize: 11 } },
        h("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true }, h("rect", { x: 5, y: 10, width: 14, height: 11, rx: 2 }), h("path", { d: "M8 10V7a4 4 0 0 1 8 0v3" })),
        "Protected admin session"
      )
    )
  );
}

// src/dashboard.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
function OMLDashboard({
  theme = "dark",
  styling
}) {
  const resolvedTheme = theme === "light" ? "light" : "dark";
  return /* @__PURE__ */ jsx11(
    "div",
    {
      className: `oml-dashboard oml-dashboard--${resolvedTheme}`,
      style: styling?.root,
      "data-oml-theme": resolvedTheme,
      children: /* @__PURE__ */ jsx11(OMLAdminGate, { children: /* @__PURE__ */ jsx11("div", { className: "oml-dashboard__frame", style: styling?.frame, children: /* @__PURE__ */ jsx11(Page, { styling }) }) })
    }
  );
}
export {
  OMLDashboard
};
import "./dashboard.css";
