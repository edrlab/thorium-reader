import { Catalog } from "readium-desktop/models/catalog";

interface LibraryImportMessage {
    paths: string[]; // List of files to import
}

interface UIMessage {
    message: string;
}

export interface UrlMessage {
    url: string;
}

export interface CatalogMessage {
    catalog: Catalog;
}
