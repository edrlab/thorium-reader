import { Downloadable } from "readium-desktop/models/downloadable";

export interface Download extends Downloadable {
    // Unique id for download
    uuid: string;

    // Url of the source file to download
    srcUrl: string;

    // Url of the downloaded
    dstPath: string;

    // Error message if status is failed
    error?: string;
}
