# @oneminutelogs/next

The official Next.js/TypeScript SDK for [OneMinuteLogs](https://oneminutelogs.com).
A lightweight, type-safe logging package that sends structured log messages to your OneMinuteLogs dashboard with automatic enrichment for tracking, security, and metrics data.

## Features

- 🚀 **Instant Setup**: Get up and running in less than a minute.
- 🔒 **Type-Safe**: Full TypeScript support with comprehensive type definitions.
- 🔍 **Structured Logging**: Well-defined schemas for Errors, Warnings, Info, Audits, and Metrics.
- 🛡️ **Security Context**: Built-in support for tracking authentication status, suspicious activities, and security tags.
- 👤 **User Tracking**: Attach user IDs, roles, and session data to every log.
- 📊 **Performance Metrics**: Log latency, database query counts, and other performance indicators.
- 📡 **Live Streaming**: Subscribe to real-time log streams directly from your application.
- 💾 **Log Retrieval**: Query historical logs programmatically.

## Installation

```bash
npm install @oneminutelogs/next
# or
yarn add @oneminutelogs/next
# or
pnpm add @oneminutelogs/next
```

## Quick Start

1. **Initialize the Logger**
   Create a logger instance, typically in a shared utility file (e.g., `src/lib/logger.ts`).

   ```typescript
   import { createLogger } from "@oneminutelogs/next";

   export const logger = createLogger({
     apiKey: process.env.ONE_MINUTE_LOGS_API_KEY!,
     appName: "my-nextjs-app", // Optional
     environment: process.env.NODE_ENV || "development", // Optional
   });
   ```

2. **Log a Message**
   Use the typed helper methods to send logs from your server-side code (API routes, Server Actions, etc.).

   ```typescript
   // Simple info log
   await logger.info({
     message: "Application started successfully"
   });

   // Error with context
   await logger.error({
     message: "Database connection failed",
     importance: "critical",
     subsystem: "db"
   });
   ```

## Configuration

The `createLogger` function accepts a configuration object:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `apiKey` | `string` | **Yes** | Your OneMinuteLogs API Key. |
| `appName` | `string` | No | Name of your application (defaults to "default"). |
| `environment`| `string` | No | Environment name (e.g., "production", "staging"). Defaults to `process.env.NODE_ENV`. |

## Usage Guide

### Basic Logging

The SDK provides helper methods for common log types:

```typescript
// Information
await logger.info({ message: "User profile updated" });

// Warnings
await logger.warning({ message: "Rate limit approaching" });

// Errors
await logger.error({ message: "Payment processing failed" });
```

### Advanced Logging

#### Security Audits
Track security-related events like login attempts or permission changes.

```typescript
await logger.audit({
  message: "Failed login attempt",
  security: {
    auth_status: "failed",
    suspicious: true,
    tags: ["brute-force", "login"]
  },
  track: {
    ip: "203.0.113.42",
    user_agent: "Mozilla/5.0..."
  }
});
```

#### Performance Metrics
Log performance data alongside your messages.

```typescript
await logger.metric({
  message: "API Request processed",
  metrics: {
    latency_ms: 145,
    db_query_count: 3
  },
  subsystem: "network",
  operation: "GET /api/users"
});
```

### Adding Context

Make your logs actionable by adding context:

- **Importance**: `critical`, `high`, `medium`, `low`
- **Subsystem**: `db`, `cache`, `queue`, `network`
- **Operation**: Name of the function or operation (e.g., `process_payment`)

```typescript
await logger.error({
  message: "Cache miss ratio high",
  importance: "high",
  subsystem: "cache",
  operation: "retrieve_user_data"
});
```

### User Tracking

Attach user context to debug issues related to specific users.

```typescript
await logger.info({
  message: "Order placed",
  track: {
    user_id: "usr_123456",
    role: "premium_user"
  }
});
```

## Retrieving Logs

You can also use the logger instance to query or stream logs programmatically.

### Querying History (`get`)

Fetch past logs based on filters.

```typescript
const recentErrors = await logger.get({
  type: "error",
  limit: 10
});
console.log(recentErrors);
```

### Live Streaming (`stream`)

Subscribe to real-time logs using Server-Sent Events (SSE).

```typescript
const logStream = logger.stream({ type: "error" });

logStream.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log("New Error Logged:", log);
};
```

## Type Definitions

The package exports all necessary types for TypeScript users:

- `LoggerConfig`
- `LogPayload`
- `LogType` (`info`, `error`, `warning`, `audit`, `metric`, `debug`, `success`)
- `Importance`
- `Subsystem`

```typescript
import type { LogPayload } from "@oneminutelogs/next";
```

---

<p align="center">
  Built with ❤️ by the One Minute Stack team.
</p>
