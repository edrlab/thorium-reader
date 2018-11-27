import { Identifiable } from "readium-desktop/common/models/identifiable";
import { Timestampable } from "readium-desktop/common/models/timestampable";

export interface ConfigDocument extends Identifiable, Timestampable {
    value: any;
}
