export enum AppStatus {
    Unknown = "unknown",
    Initialized = "initialized",
    Error = "error",
}

export interface AppState {
    status: AppStatus;
}
