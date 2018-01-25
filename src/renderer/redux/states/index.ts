import { NetState } from "readium-desktop/common/redux/states/net";

import {I18NState} from "readium-desktop/reducers/i18n";
import {CatalogState} from "readium-desktop/reducers/catalog";
import {WindowState} from "readium-desktop/renderer/reducers/window";
import {ReaderState} from "readium-desktop/renderer/reducers/reader";
import {MessageState} from "readium-desktop/renderer/reducers/message";
import {OpdsState} from "readium-desktop/reducers/opds";

import { WinState } from "./win";

export { WinState };

export interface RootState {
    net: NetState;
    win: WinState;
    i18n: I18NState;
    catalog: CatalogState;
    window: WindowState;
    reader: ReaderState;
    message: MessageState;
    opds: OpdsState;
}
