import { Contributor } from "readium-desktop/models/contributor";
import { Downloadable } from "readium-desktop/models/downloadable";
import { File } from "readium-desktop/models/file";
import { Identifiable } from "readium-desktop/models/identifiable";
import { Language } from "readium-desktop/models/language";
import { Tag } from "readium-desktop/models/tag";

/**
 * A publication
 */
export interface Publication extends Identifiable {
    title: string;
    description: string;
    cover?: File;
    physicalPageNb?: number;
    language?: Language;
    authors?: Contributor[];
    files?: File[];
    tags?: Tag[];
    download?: Downloadable;
}
