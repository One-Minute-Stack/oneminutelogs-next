# @oneminutelogs/next

The official Next.js SDK for [OneMinute Logs](https://oneminutelogs.com). Send structured events from server-side code, query stored logs, stream live events into client components, and verify alert webhooks.

## Features

- Type-safe structured logging for errors, warnings, audits, metrics, and informational events
- Buffered, batched delivery to reduce request overhead
- App Router request handler for securely proxying log queries and live streams
- React hooks for historical logs and Server-Sent Events (SSE)
- Webhook signature verification
- TypeScript declarations included

## Requirements

- A Next.js application using the App Router
- A OneMinute Logs API key
- A runtime with native `fetch`, `Request`, `Response`, and `ReadableStream` support

## Installation

```bash
npm install @oneminutelogs/next
```

```bash
pnpm add @oneminutelogs/next
```

```bash
yarn add @oneminutelogs/next
```

## Quick start

### 1. Add your API key

Add the key to `.env.local`. Keep it server-side and never prefix it with `NEXT_PUBLIC_`.

```bash
ONE_MINUTE_LOGS_API_KEY=your_api_key
```

### 2. Create a shared logger

```ts
// lib/logs.ts
import { createLogger } from "@oneminutelogs/next";

export const log = createLogger({
  apiKey: process.env.ONE_MINUTE_LOGS_API_KEY!,
  appName: "my-next-app",
  environment: process.env.NODE_ENV ?? "development",
});
```

Create the logger in server-only code. Do not import it into a client component because it contains your API key.

### 3. Send an event

Use the logger in Route Handlers, Server Actions, or other server-side modules.

```ts
// app/api/orders/route.ts
import { log } from "@/lib/logs";

export async function POST(request: Request) {
  const order = await request.json();

  await log.info({
    message: "Order received",
    subsystem: "orders",
    operation: "create-order",
    track: {
      user_id: order.userId,
    },
  });

  return Response.json({ ok: true });
}
```

Events are buffered and sent in batches in the background.

## Logging API

The logger provides typed convenience methods:

```ts
await log.info({ message: "Checkout started" });

await log.warning({
  message: "Payment provider is responding slowly",
  importance: "medium",
  subsystem: "payments",
  metrics: { latency_ms: 1850 },
});

await log.error({
  message: "Payment failed",
  importance: "high",
  subsystem: "payments",
  operation: "charge-card",
});

await log.audit({
  message: "Administrator changed a user role",
  security: {
    auth_status: "success",
    tags: ["permissions", "admin"],
  },
  track: {
    user_id: "user_123",
    role: "admin",
  },
});

await log.metric({
  message: "Database query completed",
  metrics: {
    latency_ms: 42,
    db_query_count: 1,
  },
});
```

Available methods are `info`, `warning`, `error`, `audit`, `metric`, and `send`. Use `send` when specifying the event type directly:

```ts
await log.send({
  type: "success",
  message: "Deployment completed",
  importance: "low",
});
```

### Logger configuration

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | Yes | Your OneMinute Logs API key. |
| `appName` | `string` | No | Default application name. Defaults to `default`. |
| `environment` | `string` | No | Default environment. Falls back to `NODE_ENV`, then `development`. |

Each event can override `appName` and `environment`.

## Querying logs from the browser

The client hooks call `/api/oneminutelogs/logs` and `/api/oneminutelogs/stream`. Create a catch-all App Router handler that forwards those requests without exposing your API key.

```ts
// app/api/oneminutelogs/[type]/route.ts
import { log } from "@/lib/logs";
import { handleProcessRequest } from "@oneminutelogs/next";

const forwardRequest = (request: Request) =>
  handleProcessRequest({
    request,
    logger: log,
    authorize: async (request) => {
      // Replace this with your application's authorization check.
      return Boolean(request.headers.get("cookie"));
    },
  });

export const GET = forwardRequest;
```

The final URL segment must be either `logs` or `stream`. The `authorize` callback is strongly recommended for dashboards containing private data.

If your authentication provider supplies a bearer token expected by OneMinute Logs, pass it as `authToken`:

```ts
return handleProcessRequest({
  request,
  logger: log,
  authToken: token,
});
```

### Historical logs

`getLogs` is a React hook and must be called from a client component.

```tsx
"use client";

import { getLogs } from "@oneminutelogs/next";

export default function ErrorList() {
  const { data, isLoading, error, refetch } = getLogs({
    type: "error",
    environment: "production",
    limit: 100,
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>{error.message}</p>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {data?.map((event: any) => (
        <p key={event.keyId}>{event.message}</p>
      ))}
    </div>
  );
}
```

### Live events

`getStream` opens an SSE connection and keeps up to 5,000 normalized events in memory.

```tsx
"use client";

import { getStream } from "@oneminutelogs/next";

export default function LiveEvents() {
  const { data, isLoading, error, connected, disconnect } = getStream({
    type: "error",
  });

  return (
    <section>
      <p>{connected ? "Connected" : "Disconnected"}</p>
      <button onClick={disconnect}>Disconnect</button>
      {isLoading && <p>Connecting…</p>}
      {error && <p>{error.message}</p>}
      {data.map((event) => (
        <p key={event.id}>
          [{event.level}] {event.message}
        </p>
      ))}
    </section>
  );
}
```

## Webhook verification

Verify OneMinute Logs alert webhooks before processing their contents.

```ts
// app/api/webhooks/oneminutelogs/route.ts
import { log } from "@/lib/logs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    await log.verifyWebhook({
      signature: request.headers.get("x-oml-signature") ?? "",
      timestamp: request.headers.get("x-oml-timestamp") ?? "",
      body,
    });

    // Process the verified event here.
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: "Invalid webhook" },
      { status: 401 },
    );
  }
}
```

## Exports

| Export | Purpose |
| --- | --- |
| `createLogger(config)` | Creates the server-side logger. |
| `handleProcessRequest(options)` | Proxies log queries and SSE streams through an App Router handler. |
| `getLogs(filters?)` | Client hook for querying stored events. |
| `getStream(filters?)` | Client hook for consuming live events over SSE. |
| `OMLTransport` | Low-level transport used by the logger. |
| `LoggerConfig`, `LogPayload`, `LogLevel` | Exported TypeScript types. |

## Security notes

- Keep the API key in server-only environment variables.
- Never create the logger in a client component.
- Protect the proxy route with your application's authentication and authorization checks.
- Always verify webhook signatures before acting on webhook data.

## Development

```bash
npm install
npm run build
```

## Support

- [Documentation](https://oneminutelogs.com/docs/nextjs)
- [Issue tracker](https://github.com/One-Minute-Stack/oneminutelogs-next/issues)
- [contact@oneminutelogs.com](mailto:contact@oneminutelogs.com)

## License

ISC
