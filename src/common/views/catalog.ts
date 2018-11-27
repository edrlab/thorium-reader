import { PublicationView } from "./publication";

export interface CatalogEntryView {
    title: string;
    publications?: PublicationView[];
}

export interface CatalogView {
    entries: CatalogEntryView[];
}
