import { Action } from "redux";

import { Catalog } from "readium-desktop/common/models/catalog";
import { Publication } from "readium-desktop/common/models/publication";

// Catalog action types
export const CATALOG_INIT = "CATALOG_INIT";
export const CATALOG_SET = "CATALOG_SET";
export const CATALOG_CLEAN = "CATALOG_CLEAN";

// Load from DB
export const CATALOG_LOAD = "CATALOG_LOAD";

// Publication action types
export const PUBLICATION_ADD = "PUBLICATION_ADD";
export const PUBLICATION_UPDATE = "PUBLICATION_UPDATE";
export const PUBLICATION_REMOVE = "PUBLICATION_REMOVE";

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

export function clean(): CatalogAction {
    return {
        type: CATALOG_CLEAN,
    };
}

export function load(): CatalogAction {
    return {
        type: CATALOG_LOAD,
    };
}

export function updatePublication(publication: Publication): PublicationAction {
    return {
        type: PUBLICATION_UPDATE,
        publication,
    };
}

export function removePublication(publication: Publication): PublicationAction {
    return {
        type: PUBLICATION_REMOVE,
        publication,
    };
}
