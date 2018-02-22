export enum UserKeyCheckStatus {
    Pending,
    Error,
    Success,
}

export interface LsdInfo {
    statusUrl: string;
}

export interface LcpRights {
    print?: number;
    copy?: number;
    start?: Date;
    end?: Date;
}

export interface LcpInfo {
    provider: string;
    issued: Date;
    updated?: Date;
    lsd?: LsdInfo;
    rights: LcpRights;
}

export interface DeviceConfig {
    [key: string]: any;
}
