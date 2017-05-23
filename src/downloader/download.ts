export enum DownloadStatus {
    Init, // Initial state
    Downloading, // File is downloading
    Canceled, // File download has been canceled
    Failed, // File download has failed
    Downloaded, // File has been downloaded
}

export interface Download {
    // Unique id for download
    uuid: string;

    // Url of the source file to download
    srcUrl: string;

    // Url of the downloaded
    dstPath: string;

    // Progress in percent
    progress: number;

    // Error message if status is failed
    error?: string;

    // Status of file
    status: DownloadStatus;
}
