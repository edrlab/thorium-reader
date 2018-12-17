import { CoverView } from "./publication";

export interface OpdsFeedView {
    identifier: string;
    title: string;
    url: string;
}

export interface OpdsPublicationView {
    title: string;
    authors: string[];
    publishers?: string[];
    workIdentifier?: string;
    description?: string;
    tags?: string[];
    languages?: string[];
    publishedAt?: string; // ISO8601
    cover?: CoverView;
}

export interface OpdsLinkView {
    title: string;
    url: string;
    publicationCount?: number;
}

export enum OpdsResultType {
    Entry = "entry",
    NavigationFeed = "navigation-feed",
    PublicationFeed = "publication-feed",
}

export interface OpdsResultView {
    title: string;
    type: OpdsResultType;
    navigation: OpdsLinkView[];
    publications: OpdsPublicationView[];
}
