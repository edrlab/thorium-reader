export enum DownloadStatus {
    Init, // Initial state
    Downloading, // Item is downloading
    Canceled, // Item download has been canceled
    Failed, // Item download has failed
    Downloaded, // Item has been downloaded
}

export interface Downloadable {
    status: DownloadStatus;
    progress: number; // Positive and non float number between 0 and 100
}
