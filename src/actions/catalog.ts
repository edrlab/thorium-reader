import { Catalog } from "readium-desktop/models/catalog";
import { Action } from "redux";

// Catalog action types
export const CATALOG_SET = "CATALOG_SET";
export const CATALOG_CLEAN = "CATALOG_CLEAN";

export interface CatalogAction extends Action {
    catalog?: Catalog;
}

export function set(catalog: Catalog): CatalogAction {
    return {
        type: CATALOG_SET,
        catalog,
    };
}

export function clean(catalog: Catalog): CatalogAction {
    return {
        type: CATALOG_CLEAN,
    };
}
