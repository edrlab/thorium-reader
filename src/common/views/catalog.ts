import { PublicationView } from "./publication";

export interface CatalogEntryView {
    title: string;
    tag?: string;
    totalCount?: number;
    publications?: PublicationView[];
}

export interface CatalogView {
    entries: CatalogEntryView[];
}
