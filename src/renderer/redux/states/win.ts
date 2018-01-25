export enum WinStatus {
    Unknown = "unknown",
    Initialized = "initialized",
    Error = "error",
}

export interface WinState {
    status: WinStatus;
    winId: string;
}
