import { Downloadable } from "readium-desktop/models/downloadable";
import { Identifiable } from "readium-desktop/models/identifiable";

export interface Download extends Downloadable, Identifiable {
    // Url of the source file to download
    srcUrl: string;

    // Url of the downloaded
    dstPath: string;

    // Error message if status is failed
    error?: string;
}
