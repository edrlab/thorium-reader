import { Contributor } from "readium-desktop/models/contributor";
import { File } from "readium-desktop/models/file";
import { Language } from "readium-desktop/models/language";
import { Tag } from "readium-desktop/models/tag";

/**
 * A publication
 */
export interface Publication {
    title: string;
    description: string;
    cover?: File;
    physicalPageNb?: number;
    language?: Language;
    authors?: Contributor[];
    files?: File[];
    tags?: Tag[];
}
