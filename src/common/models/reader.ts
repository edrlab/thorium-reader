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

/**
 * A reader configuration
 */
export interface ReaderConfig {
    [key: string]: any;
    identifier?: string;
    align: "center"|"left"|"right";
    colCount: string;
    dark: false;
    font: string;
    fontSize: any;
    invert: boolean;
    lineHeight: string;
    night: boolean;
    paged: boolean;
    readiumcss: boolean;
    sepia: boolean;
}
