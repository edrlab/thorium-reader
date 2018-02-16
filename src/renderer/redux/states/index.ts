
import {MessageState} from "readium-desktop/renderer/reducers/message";
import {WindowState} from "readium-desktop/renderer/reducers/window";

import { CatalogState } from "readium-desktop/common/redux/states/catalog";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { LcpState } from "readium-desktop/common/redux/states/lcp";
import { NetState } from "readium-desktop/common/redux/states/net";
import { OpdsState } from "readium-desktop/common/redux/states/opds";

import {
    PublicationDownloadState,
} from "readium-desktop/common/redux/states/publication-download";
import { ReaderState } from "readium-desktop/common/redux/states/reader";

import { WinState } from "./win";
export { WinState };

export interface RootState {
    net: NetState;
    win: WinState;
    i18n: I18NState;
    lcp: LcpState;
    catalog: CatalogState;
    window: WindowState;
    message: MessageState;
    opds: OpdsState;
    publicationDownloads: PublicationDownloadState;
    reader: ReaderState;
}
