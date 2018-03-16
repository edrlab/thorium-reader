export enum UpdateStatus {
    Unknown = "unknown",
    NoUpdate = "no-update",
    Update = "update",
    SecurityUpdate = "security-update",
}

export interface UpdateState {
    status: UpdateStatus;
    latestVersion: string;
    latestVersionUrl: string;
}
