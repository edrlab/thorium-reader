import { Action } from "redux";

import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

// Catalog action types
export const CATALOG_INIT = "CATALOG_INIT";
export const CATALOG_SET = "CATALOG_SET";
export const CATALOG_CLEAN = "CATALOG_CLEAN";

// Publication action types
export const PUBLICATION_ADD = "PUBLICATION_ADD";
export const PUBLICATION_DOWNLOAD_ADD = "PUBLICATION_DOWNLOAD_ADD";
export const PUBLICATION_DOWNLOAD_START = "PUBLICATION_DOWNLOAD_START";
export const PUBLICATION_DOWNLOAD_PROGRESS = "PUBLICATION_DOWNLOAD_PROGRESS";
export const PUBLICATION_DOWNLOAD_FINISH = "PUBLICATION_DOWNLOAD_FINISH";

export interface CatalogAction extends Action {
    catalog?: Catalog;
}

export interface PublicationAction extends Action {
    publication?: Publication;
}

export function init(): CatalogAction {
    return {
        type: CATALOG_INIT,
    };
}

export function set(catalog: Catalog): CatalogAction {
    return {
        type: CATALOG_SET,
        catalog,
    };
}

export function addPublication(publication: Publication): PublicationAction {
    return {
        type: PUBLICATION_ADD,
        publication,
    };
}

export function addPublicationDownload(publication: Publication): PublicationAction {
    return {
        type: PUBLICATION_DOWNLOAD_ADD,
        publication,
    };
}

export function clean(): CatalogAction {
    return {
        type: CATALOG_CLEAN,
    };
}
