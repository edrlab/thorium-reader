// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderMode } from "readium-desktop/common/models/reader";
import { I18NState } from "readium-desktop/common/redux/states/i18n";
import { IKeyboardState } from "readium-desktop/common/redux/states/keyboard";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

import { AppState } from "./app";
import { IDictPublicationState } from "./publication";
import { StreamerState } from "./streamer";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { IWizardState } from "readium-desktop/common/redux/states/wizard";
import { ISettingsState } from "readium-desktop/common/redux/states/settings";

export interface RootState extends ICommonRootState {
    app: AppState;
    // net: NetState;
    i18n: I18NState;
    streamer: StreamerState;
    // update: UpdateState;
    mode: ReaderMode;
    publication: {
        lastReadingQueue: TPQueueState;
        readingFinishedQueue: TPQueueState;
        db: IDictPublicationState;
    };
    keyboard: IKeyboardState;
    opds: {
        catalog: OpdsFeedDocument[];
    },
    version: string;
    wizard: IWizardState;
    settings: ISettingsState;
}

export type PersistRootState = Pick<RootState, "publication" | "reader" | "screenReader" | "i18n" | "opds" | "version" | "theme" | "wizard" | "settings" | "creator" | "noteExport" | "customization">;
