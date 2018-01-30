import { AppState } from "./app";
import { ReaderState } from "./reader";
import { StreamerState } from "./streamer";

// FIXME
import { CatalogState } from "readium-desktop/reducers/catalog";

import { DownloaderState } from "readium-desktop/common/redux/states/downloader";
import { NetState } from "readium-desktop/common/redux/states/net";
import { OpdsState } from "readium-desktop/common/redux/states/opds";
import {
    PublicationDownloadState,
} from "readium-desktop/common/redux/states/publication-download";

export interface RootState {
    app: AppState;
    net: NetState;
    streamer: StreamerState;
    downloader: DownloaderState;
    publicationDownloads: PublicationDownloadState;
    catalog: CatalogState;
    reader: ReaderState;
    opds: OpdsState;
}
