import { Contributor } from "./contributor";
import { CustomCover } from "./custom-cover";
import { Downloadable } from "./downloadable";
import { File } from "./file";
import { Identifiable } from "./identifiable";
import { Language } from "./language";
import { Tag } from "./tag";

export function getTitleString(titleObj: any, lang?: string): string {

    if (!titleObj) {
        return "";
    }

    if (typeof titleObj === "string") {
        return titleObj;
    }

    if (lang && titleObj[lang]) {
        return titleObj[lang];
    }

    const keys = Object.keys(titleObj);
    if (keys && keys.length) {
        return titleObj[keys[0]];
    }

    return "";
}

/**
 * A publication
 */
export interface Publication extends Identifiable {
    title: string;
    description: string;
    cover?: File;
    customCover?: CustomCover;
    physicalPageNb?: number;
    languages?: Language[];
    authors?: Contributor[];
    files?: File[];
    tags?: Tag[];
    download?: Downloadable;
}
