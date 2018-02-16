import { CatalogState } from "readium-desktop/common/redux/states/catalog";
import { DownloaderState } from "readium-desktop/common/redux/states/downloader";
import { LcpState } from "readium-desktop/common/redux/states/lcp";
import { NetState } from "readium-desktop/common/redux/states/net";
import { OpdsState } from "readium-desktop/common/redux/states/opds";
import {
    PublicationDownloadState,
} from "readium-desktop/common/redux/states/publication-download";
import { ReaderState } from "readium-desktop/common/redux/states/reader";

import { AppState } from "./app";
import { StreamerState } from "./streamer";

export interface RootState {
    app: AppState;
    net: NetState;
    streamer: StreamerState;
    downloader: DownloaderState;
    publicationDownloads: PublicationDownloadState;
    catalog: CatalogState;
    reader: ReaderState;
    opds: OpdsState;
    lcp: LcpState;
}
