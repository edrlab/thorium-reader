import { Publication } from "./publication";

/**
 * A catalog contains a list of publications
 */
export interface Catalog {
    title: string;
    publications: Publication[];
}
