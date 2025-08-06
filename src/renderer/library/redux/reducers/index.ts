// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { downloadActions } from "readium-desktop/common/redux/actions";
import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { keyboardReducer } from "readium-desktop/common/redux/reducers/keyboard";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { loadReducer } from "readium-desktop/renderer/common/redux/reducers/load";
import { winReducer } from "readium-desktop/renderer/common/redux/reducers/win";
import { historyReducer } from "readium-desktop/renderer/library/redux/reducers/history";
import {
    opdsBreadcrumbReducer, opdsHeaderLinkReducer, opdsSearchLinkReducer,
} from "readium-desktop/renderer/library/redux/reducers/opds";
import { priorityQueueReducer } from "readium-desktop/utils/redux-reducers/pqueue.reducer";
import { combineReducers, Reducer } from "redux";

// import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

import { RouterState } from "redux-first-history";
import { sessionReducer } from "readium-desktop/common/redux/reducers/session";
import { catalogViewReducer } from "./catalog";
import { tagReducer } from "readium-desktop/common/redux/reducers/tag";
import { readerDefaultConfigReducer } from "readium-desktop/common/redux/reducers/reader/defaultConfig";
import { themeReducer } from "readium-desktop/common/redux/reducers/theme";

// import { ReaderConfig } from "readium-desktop/common/models/reader";
import { readerRTLFlipReducer } from "readium-desktop/common/redux/reducers/reader/rtlFlip";
import { wizardReducer } from "readium-desktop/common/redux/reducers/wizard";
import { versionUpdateReducer } from "readium-desktop/common/redux/reducers/version-update";
import { creatorReducer } from "readium-desktop/common/redux/reducers/creator";
import { settingsReducer } from "readium-desktop/common/redux/reducers/settings";
import { importAnnotationReducer } from "readium-desktop/renderer/common/redux/reducers/importAnnotation";
import { lcpReducer } from "readium-desktop/common/redux/reducers/lcp";
import { noteExportReducer } from "readium-desktop/common/redux/reducers/noteExport";
import { customizationPackageActivatingReducer } from "readium-desktop/common/redux/reducers/customization/activate";
import { customizationPackageProvisioningReducer } from "readium-desktop/common/redux/reducers/customization/provision";

export const rootReducer = (routerReducer: Reducer<RouterState>) => { // : Reducer<Partial<ILibraryRootState>>
    return combineReducers({ // ILibraryRootState
        versionUpdate: versionUpdateReducer,
        theme: themeReducer,
        reader: combineReducers({
            defaultConfig: readerDefaultConfigReducer,
            disableRTLFlip: readerRTLFlipReducer,
        }),
        session: sessionReducer,
        i18n: i18nReducer,
        opds: combineReducers({
            browser: combineReducers({
                breadcrumb: opdsBreadcrumbReducer,
                header: opdsHeaderLinkReducer,
                search: opdsSearchLinkReducer,
            }),
        }),
        win: winReducer,
        // net: netReducer,
        // update: updateReducer,
        api: apiReducer,
        dialog: dialogReducer,
        router: routerReducer,
        toast: toastReducer,
        download: priorityQueueReducer
            <
                downloadActions.progress.TAction,
                downloadActions.done.TAction,
                downloadActions.progress.Payload,
                number
            >(
                {
                    push: {
                        type: downloadActions.progress.ID,
                        selector: (action) =>
                            [action.payload, action.payload.id],
                    },
                    pop: {
                        type: downloadActions.done.ID,
                        selector: (action) => [undefined, action.payload.id],
                    },
                    sortFct: (a, b) => b[1] - a[1],
                },
            ),
        history: historyReducer,
        keyboard: keyboardReducer,
        load: loadReducer,
        publication: combineReducers({
            catalog: catalogViewReducer,
            tag: tagReducer,
        }),
        wizard: wizardReducer,
        creator: creatorReducer,
        settings: settingsReducer,
        importAnnotations: importAnnotationReducer,
        lcp: lcpReducer,
        noteExport: noteExportReducer,
        customization: combineReducers({
            activate: customizationPackageActivatingReducer,
            provision: customizationPackageProvisioningReducer,
        }),
    });
};
