import {
    Reader, ReaderConfig,
} from "readium-desktop/common/models/reader";

export interface ReaderState {
    // Base url of started server
    readers: { [identifier: string]: Reader };

    // Config for all readers
    config: ReaderConfig;
}
