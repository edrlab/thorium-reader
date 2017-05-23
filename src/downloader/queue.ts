import { Download } from "readium-desktop/downloader/download";

/**
 * Queue containing all downloads
 */
export class Queue {
    // List of download uuids
    private keys: string[];

    // Dictionary: uuid => download
    private values: { [id: string]: Download };

    public constructor() {
        this.keys = [];
        this.values = {};
    }

    public add(download: Download) {
        this.values[download.uuid] = download;
        this.keys.push(download.uuid);
    }
}
