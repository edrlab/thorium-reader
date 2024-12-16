// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { select as selectTyped, take as takeTyped, all as allTyped, call as callTyped, SagaGenerator } from "typed-redux-saga/macro";

import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { readerLocalActionExportAnnotationSet } from "../actions";
// import { delay } from "redux-saga/effects";
import { getResourceCache } from "./resourceCache";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { convertAnnotationStateArrayToReadiumAnnotationSet, IAnnotationStateWithICacheDocument } from "readium-desktop/common/readium/annotation/converter";
import { IReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/annotationModel.type";

// Logger
const debug = debug_("readium-desktop:renderer:reader:redux:sagas:shareAnnotationSet");
debug("_");



const getCacheDocumentFromLocator = (cacheDocumentArray: ICacheDocument[], locator: MiniLocatorExtended): ICacheDocument => {

    for (const cacheDoc of cacheDocumentArray) {
        if (cacheDoc.href && cacheDoc.href === locator?.locator?.href) {
            return cacheDoc;
        }
    }

    return undefined;
};

function* exportAnnotationSet(): SagaGenerator<void> {

    const exportAnnotationSetAction = yield* takeTyped(readerLocalActionExportAnnotationSet.build);
    const { payload: { annotationArray, publicationView, label } } = exportAnnotationSetAction;

    yield* callTyped(getResourceCache);

    debug("exportAnnotationSet just started !");
    debug(annotationArray);
    debug(typeof publicationView);
    debug("label", label);
    // yield delay(10000);

    const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);

    const annotationsWithCacheDocumentArray: IAnnotationStateWithICacheDocument[] = [];

    for (const anno of annotationArray) {
        annotationsWithCacheDocumentArray.push({
            ...anno,
            __cacheDocument: getCacheDocumentFromLocator(cacheDocuments, anno.locatorExtended),
        });
    }

    const readiumAnnotationSet = yield* callTyped(() => convertAnnotationStateArrayToReadiumAnnotationSet(annotationsWithCacheDocumentArray, publicationView, label));

    const downloadAnnotationJSON = (contents: IReadiumAnnotationSet, filename: string) => {

        const data = JSON.stringify(contents, null, 2);
        const blob = new Blob([data], { type: "application/rd-annotations+json" });
        const jsonObjectUrl = URL.createObjectURL(blob);
        const anchorEl = document.createElement("a");
        anchorEl.href = jsonObjectUrl;
        anchorEl.download = `${filename}.annotation`;
        anchorEl.click();
        URL.revokeObjectURL(jsonObjectUrl);
    };

    downloadAnnotationJSON(readiumAnnotationSet, label);

}

export const saga = () =>
    allTyped([
        spawnLeading(
            exportAnnotationSet,
            (e) => console.error("readerStart", e),
        ),
    ]);

