import { Catalog } from "readium-desktop/models/catalog";
import { Download } from "readium-desktop/models/download";
import { OPDS } from "readium-desktop/models/opds";
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

export interface OpdsMessage {
    opdsList?: OPDS[];
    opds?: OPDS;
}

export interface CatalogMessage {
    catalog: Catalog;
}

export interface PublicationMessage {
    publication: Publication;
}

export interface DownloadMessage {
    download: Download;
}

export interface FilesMessage {
    paths?: string[];
    identifier?: string;
}
