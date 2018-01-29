import {
    Reader,
} from "readium-desktop/common/models/reader";

export interface ReaderState {
    // Base url of started server
    readers: { [identifier: string]: Reader };
}
