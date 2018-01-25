import { AppState } from "./app";
import { PublicationDownloadState } from "./publication-download";
import { ReaderState } from "./reader";
import { StreamerState } from "./streamer";

// FIXME
import { CatalogState } from "readium-desktop/reducers/catalog";
import { DownloaderState } from "readium-desktop/reducers/downloader";

import { NetState } from "readium-desktop/common/redux/states/net";
import { OpdsState } from "readium-desktop/common/redux/states/opds";

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
