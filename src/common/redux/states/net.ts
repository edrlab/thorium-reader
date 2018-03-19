export enum NetStatus {
    Unknown = "unknown",
    Online = "online",
    Offline = "offline",
}

export interface NetState {
    status: NetStatus;
}
