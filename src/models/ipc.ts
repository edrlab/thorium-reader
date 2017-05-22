import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

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

export interface PublicationMessage {
    publication: Publication;
}
