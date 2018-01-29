import { BrowserWindow } from "electron";

import { Identifiable } from "./identifiable";
import { Publication } from "./publication";

/**
 *  A reader
 */
export interface Reader extends Identifiable {
    filesystemPath: string;
    manifestUrl: string;
    publication: Publication;
    window: BrowserWindow;
}
