import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface OpdsDocument extends Identifiable, Timestampable {
    name: string;
    url: string;
}
