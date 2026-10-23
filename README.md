# @oneminutelogs/next

The official Next.js SDK for [OneMinute Logs](https://oneminutelogs.com). Send structured server logs, embed an authenticated monitoring dashboard, and view historical or live events.

## Install

```bash
npm install @oneminutelogs/next
```

Requires Node.js 18+, React 18+, and Next.js App Router for the route examples below.

## Send logs

Set `ONE_MINUTE_LOGS_API_KEY` in your server environment. Never expose it through a `NEXT_PUBLIC_*` variable.

```ts
// lib/logs.ts
import "server-only";
import { createLogger } from "@oneminutelogs/next";

export const logger = createLogger({
  apiKey: process.env.ONE_MINUTE_LOGS_API_KEY!,
  projectName: "my-app",
  serviceName: "my-api",
  environment: process.env.NODE_ENV || "development",
});
```

Use the logger from Route Handlers, Server Actions, or other server modules:

```ts
await logger.info({
  message: "Account created",
  eventName: "account.created",
  attributes: { "user.id": user.id },
});
```

Available methods: `trace`, `debug`, `info`, `warn`, `error`, and `fatal`. Payloads support `message`, `eventName`, `attributes`, `timestamp`, and optional `traceId` / `spanId` from your tracing context. Configuration also accepts `serviceVersion` and `defaultAttributes`.

Logs are buffered and sent in batches. Awaiting a logging call confirms queuing, not delivery to OML.

## Embed the dashboard

### 1. Configure access

Set these additional **server-only** environment variables to protect the dashboard:

```dotenv
ONE_MINUTE_LOGS_ADMIN_PASSWORD=replace-with-a-strong-password
ONE_MINUTE_LOGS_ADMIN_SESSION_SECRET=replace-with-a-long-random-signing-secret
```

Use independent secrets and the same values across application replicas. Changing them invalidates existing sessions. The OneMinute CLI can generate these values during initialization.

### 2. Add the forwarding route

```ts
// app/api/oneminutelogs/[...path]/route.ts
import { forwardRequest } from "@oneminutelogs/next";
import { logger } from "@/lib/logs";

const handler = forwardRequest({ logger });

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
```

Use one catch-all route. Replace an existing `[type]` or `[types]` route instead of keeping both. Credentials stay on the server; dashboard access requires the admin session.

### 3. Render the dashboard

```tsx
// app/monitoring/page.tsx
import { OMLDashboard } from "@oneminutelogs/next/dashboard";

export default function MonitoringPage() {
  return (
    <OMLDashboard
      theme="light"
      styling={{
        shell: { fontFamily: "Arial, sans-serif" },
        sidebar: { borderRight: "1px solid #d8e0eaa3" },
        title: { letterSpacing: "-0.02em" },
      }}
    />
  );
}
```

The dashboard includes Overview, API Performance, Browser Health, Realtime Logs, Incidents, Alerts, and Billing. Its password gate and stylesheet are included; no Tailwind setup or CSS import is required.

`theme` accepts `"light"` or `"dark"`; omitted or `null` defaults to dark. The optional `styling` object accepts React CSS properties for these elements:

`root`, `frame`, `shell`, `sidebar`, `navigation`, `navItem`, `activeNavItem`, `sidebarFooter`, `usage`, `content`, `main`, `pageHeading`, `title`, `description`.

The embedded dashboard uses the `/api/oneminutelogs` route. Browser Health requires browser telemetry; rendering the dashboard alone does not collect it.

## Add browser monitoring

Install `@oneminutelogs/browser` and wrap your application with its `OMLProvider`. See the [browser SDK setup](https://github.com/One-Minute-Stack/oneminutelogs-browser#readme).

Enable browser forwarding on the same catch-all handler:

```ts
const handler = forwardRequest({
  logger,
  browser: {
    apiKey: process.env.ONE_MINUTE_LOGS_API_KEY!,
    projectName: "my-app",
    environment: process.env.NODE_ENV || "development",
    routeTemplates: ["/", "/jobs/[id]"],
    endpointTemplates: ["/api/jobs/[id]"],
  },
});
```

Keep the method exports above and configure matching route and endpoint templates on `OMLProvider`. Browser submissions do not require a dashboard admin session.

## Build a custom log view

Client components can use `getLogs(filters?)` for historical events and `getStream(filters?)` for live events. Both use the protected forwarding route. Wrap custom views with `OMLAdminGate` from `@oneminutelogs/next/admin` for password login.

```tsx
"use client";

import { getLogs } from "@oneminutelogs/next";

export function ErrorList() {
  const { data, isLoading, error } = getLogs({
    type: "error",
    range: "24h",
    limit: 100,
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Unable to load logs.</p>;
  return <>{data?.map(event => <p key={event.id}>{event.message}</p>)}</>;
}
```

Filters include `type`, `env`, `appName`, `search`, and `limit`; historical reads also accept `range`. `getStream` returns `data`, `isLoading`, `error`, `connected`, and `disconnect`.

## Support

[Documentation](https://oneminutelogs.com/docs/nextjs) · [Report an issue](https://github.com/One-Minute-Stack/oneminutelogs-next/issues)

ISC license.
