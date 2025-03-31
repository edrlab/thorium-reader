// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    annotationActions,
    apiActions, creatorActions, i18nActions, keyboardActions, lcpActions, publicationActions, readerActions, themeActions, apiKeysActions,
} from "readium-desktop/common/redux/actions";
import { syncFactory } from "readium-desktop/renderer/common/redux/middleware/syncFactory";

// Actions that can be synchronized
const SYNCHRONIZABLE_ACTIONS: string[] = [

    apiActions.request.ID,

    readerActions.clipboardCopy.ID,
    readerActions.openRequest.ID,
    readerActions.closeRequest.ID,
    readerActions.detachModeRequest.ID,
    readerActions.setReduxState.ID,
    readerActions.configSetDefault.ID,  // readerConfig
    // readerActions.saveBookmarkRequest.ID,
    readerActions.fullScreenRequest.ID,

    i18nActions.setLocale.ID,

    keyboardActions.setShortcuts.ID,
    keyboardActions.showShortcuts.ID,
    keyboardActions.reloadShortcuts.ID,

    // sessionActions.enable.ID,

    lcpActions.renewPublicationLicense.ID,
    lcpActions.returnPublication.ID,
    lcpActions.unlockPublicationWithPassphrase.ID,

    themeActions.setTheme.ID,
    readerActions.disableRTLFlip.ID,

    publicationActions.readingFinished.ID,

    // needed to forward event to other reader windows, already synchronised with persistence readerActions.setReduxState
    readerActions.bookmark.pop.ID,
    readerActions.bookmark.push.ID,
    readerActions.bookmark.update.ID,

    // needed to forward event to other reader windows, already synchronised with persistence readerActions.setReduxState
    readerActions.annotation.pop.ID,
    readerActions.annotation.push.ID,
    readerActions.annotation.update.ID,

    annotationActions.importAnnotationSet.ID,
    annotationActions.importConfirmOrAbort.ID,

    creatorActions.set.ID,

    annotationActions.shiftFromAnnotationImportQueue.ID,

    apiKeysActions.setKey.ID,


];

export const reduxSyncMiddleware = syncFactory(SYNCHRONIZABLE_ACTIONS);
