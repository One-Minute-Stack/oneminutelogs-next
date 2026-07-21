type LogCustomValue = string | number | boolean | null;
interface LogTrack {
    user_id?: string;
    role?: UserRole;
    ip?: string;
    user_agent?: string;
    geo?: string;
    custom?: Record<string, LogCustomValue>;
}

interface LogMetrics {
    latency_ms?: number;
    db_query_count?: number;
    custom?: Record<string, LogCustomValue>;
}

interface LogSecurity {
    auth_status?: AuthStatus;
    ip_address?: string;
    suspicious?: boolean;
    tags?: string[];
    custom?: Record<string, LogCustomValue>;
}

interface LogTimestamps {
    event_time: string;
    ingest_time?: string;
}

type LogLevel$1 = "info" | "warn" | "error";
interface LoggerConfig {
    apiKey: string;
    appName?: string;
    environment?: string;
}
interface LogPayload {
    type: LogType;
    message: string;
    importance?: Importance;
    subsystem?: string;
    operation?: string;
    track?: LogTrack;
    security?: LogSecurity;
    metrics?: LogMetrics;
    service?: string;
    timestamps?: LogTimestamps;
    ingested_at?: number;
    appName?: string;
    environment?: string;
}
type LogType = "error" | "warning" | "info" | "audit" | "metric" | "debug" | "success";
type Importance = "critical" | "high" | "medium" | "low";
type UserRole = "super-admin" | "admin" | "user";
type AuthStatus = "success" | "failed" | "expired";

interface LogRequestOptions {
    authToken?: string;
}
interface VerifyWebhookOptions {
    signature: string;
    timestamp: string;
    body: unknown;
}
declare class OMLTransport {
    private config;
    private baseUrl;
    private apiKey;
    private appName;
    private environment;
    private headers;
    private buffer;
    private timer;
    private flushInterval;
    private shuttingDown;
    private isFlushing;
    constructor(config: LoggerConfig);
    send(payload: LogPayload): Promise<void>;
    private setupGracefulShutdown;
    private flush;
    private buildReadHeaders;
    get(filters?: Record<string, any>, options?: LogRequestOptions): Promise<any>;
    verifyWebhook({ signature, timestamp, body }: VerifyWebhookOptions): Promise<any>;
    stream(filters?: Record<string, any>, options?: LogRequestOptions): {
        body: ReadableStream<Uint8Array>;
    };
}

declare function createLogger(config: LoggerConfig): {
    send: (payload: LogPayload) => Promise<void>;
    info: (payload: Omit<LogPayload, "type">) => Promise<void>;
    error: (payload: Omit<LogPayload, "type">) => Promise<void>;
    metric: (payload: Omit<LogPayload, "type">) => Promise<void>;
    audit: (payload: Omit<LogPayload, "type">) => Promise<void>;
    warning: (payload: Omit<LogPayload, "type">) => Promise<void>;
    get: (filters?: Record<string, any>, options?: LogRequestOptions) => Promise<any>;
    verifyWebhook: (options: VerifyWebhookOptions) => Promise<any>;
    stream: (filters?: Record<string, any>, options?: LogRequestOptions) => {
        body: ReadableStream<Uint8Array>;
    };
};

interface ProcessLogger {
    get: (filters?: Record<string, any>, options?: {
        authToken?: string;
    }) => Promise<unknown>;
    stream: (filters?: Record<string, any>, options?: {
        authToken?: string;
    }) => {
        body: ReadableStream<Uint8Array>;
    };
}
interface HandleProcessRequestOptions {
    request: Request;
    logger?: ProcessLogger;
    authToken?: string | null;
    apiKey?: string;
    appName?: string;
    environment?: string;
    baseUrl?: string;
    authorize?: (request: Request) => boolean | Promise<boolean>;
}
declare function handleProcessRequest({ request, logger, authToken, apiKey, appName, environment, baseUrl, authorize, }: HandleProcessRequestOptions): Promise<Response>;

type Filters$1 = Record<string, string | number | boolean | undefined>;
type GetLogsResult<T = any> = {
    data: T[] | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};
declare function getLogs<T = any>(filters?: Filters$1): GetLogsResult<T>;

type Filters = Record<string, string | number | boolean | undefined>;
type LogLevel = "info" | "warning" | "error" | "debug" | "success" | "audit" | "metric";
type StreamLogNormalized = {
    id: string;
    ts: string;
    level: LogLevel;
    source: string;
    message: string;
    payload: Record<string, unknown>;
};
type GetStreamResult = {
    data: StreamLogNormalized[];
    isLoading: boolean;
    error: Error | null;
    connected: boolean;
    disconnect: () => void;
};
declare function getStream(filters?: Filters): GetStreamResult;

export { type HandleProcessRequestOptions, type LogLevel$1 as LogLevel, type LogPayload, type LoggerConfig, OMLTransport, createLogger, getLogs, getStream, handleProcessRequest };
