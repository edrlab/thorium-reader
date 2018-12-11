import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface OpdsFeedDocument extends Identifiable, Timestampable {
    title: string;
    url: string;
}
