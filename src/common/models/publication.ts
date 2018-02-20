import { Contributor } from "./contributor";
import { CustomCover } from "./custom-cover";
import { Downloadable } from "./downloadable";
import { File } from "./file";
import { Identifiable } from "./identifiable";
import { Language } from "./language";
import { Tag } from "./tag";

/**
 * A publication
 */
export interface Publication extends Identifiable {
    title: string; // note: can be multilingual object map (not just string)
    description: string;
    cover?: File;
    customCover?: CustomCover;
    physicalPageNb?: number;
    languages?: Language[];
    authors?: Contributor[];
    files?: File[];
    tags?: Tag[];
    // lcp: boolean; // true if publication contains lcp
}
