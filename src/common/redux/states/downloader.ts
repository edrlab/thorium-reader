import { Download } from "readium-desktop/common/models/download";

export interface DownloaderState {
    downloads: { [identifier: string]: Download };
}
