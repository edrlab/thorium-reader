import { Catalog } from "./catalog";
import { Download } from "./download";
import { Publication } from "./publication";

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

export interface DownloadMessage {
    download: Download;
}

export interface FilesMessage {
    paths?: string[];
    identifier?: string;
}
