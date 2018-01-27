import {
    Reader,
} from "readium-desktop/models/reader";

export interface ReaderState {
    // Base url of started server
    readers: { [identifier: string]: Reader };
}
