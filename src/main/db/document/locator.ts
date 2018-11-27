import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Locator } from "readium-desktop/common/models/locator";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export enum LocatorType {
    LastReadingLocation = "last-reading-location",
    Bookmark = "bookmark"
}

export interface LocatorDocument extends Identifiable, Timestampable {
    locator: Locator;
    locatorType: LocatorType;
    publicationIdentifier: string;
}
