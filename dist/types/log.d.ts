import { LogType, Importance, Subsystem } from "./index.js";
import { LogTrack } from "./track.js";
import { LogSecurity } from "./security.js";
import { LogMetrics } from "./metrics.js";
export interface LogTimestamps {
    event_time: string;
    ingest_time?: string;
}
export interface LogMessage {
    type: LogType;
    message: string;
    importance: Importance;
    subsystem: Subsystem;
    operation?: string;
    track: LogTrack;
    security: LogSecurity;
    metrics: LogMetrics;
    timestamps: LogTimestamps;
}
