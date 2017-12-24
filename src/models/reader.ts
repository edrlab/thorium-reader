import { BrowserWindow } from "electron";

import { Identifiable } from "readium-desktop/models/identifiable";
import { Publication } from "readium-desktop/models/publication";

/**
 *  A reader
 */
export interface Reader extends Identifiable {
    publication: Publication;
    window: BrowserWindow;
}
