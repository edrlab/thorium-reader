// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
<<<<<<< HEAD
    apiActions, authActions, catalogActions, downloadActions, i18nActions, keyboardActions, lcpActions, readerActions, sessionActions,
=======
    annotationActions,
    apiActions, authActions, downloadActions, i18nActions, keyboardActions, readerActions,
>>>>>>> e7126b80 (add: saga logic)
} from "readium-desktop/common/redux/actions";
import { syncFactory } from "readium-desktop/renderer/common/redux/middleware/syncFactory";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: string[] = [

    apiActions.request.ID,

    authActions.wipeData.ID,

    readerActions.openRequest.ID,
    readerActions.closeRequest.ID,
    readerActions.detachModeRequest.ID,
    readerActions.setReduxState.ID,
    // readerActions.saveBookmarkRequest.ID,
    readerActions.fullScreenRequest.ID,

    i18nActions.setLocale.ID,

    keyboardActions.setShortcuts.ID,
    keyboardActions.showShortcuts.ID,
    keyboardActions.reloadShortcuts.ID,

    downloadActions.abort.ID,

<<<<<<< HEAD
    sessionActions.enable.ID,

    lcpActions.renewPublicationLicense.ID,
    lcpActions.returnPublication.ID,
    lcpActions.unlockPublicationWithPassphrase.ID,

    catalogActions.getCatalog.ID, // request to get catalog view
=======
    annotationActions.exportW3CAnnotationSetFromAnnotations.ID,
>>>>>>> e7126b80 (add: saga logic)
];

export const reduxSyncMiddleware = syncFactory(SYNCHRONIZABLE_ACTIONS);
