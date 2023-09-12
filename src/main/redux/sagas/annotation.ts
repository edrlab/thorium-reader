// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { annotationActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call as callTyped, select as selectTyped } from "typed-redux-saga/macro";
import { getPublication } from "./api/publication/getPublication";
import { convertAnnotationListToW3CAnnotationModelSet, convertPublicationToAnnotationStateAbout } from "readium-desktop/main/w3c/annotation/converter";
import { RootState } from "../states";
import { IAnnotationState } from "readium-desktop/common/redux/states/annotation";
import { saveW3CAnnotationModelSetFromFilePath } from "readium-desktop/main/w3c/annotation/fs";
import { getLibraryWindowFromDi } from "readium-desktop/main/di";
import { dialog } from "electron";
import { promises as fsp } from "fs";
import * as path from "path";

// Logger
const filename_ = "readium-desktop:main:saga:annotation";
const debug = debug_(filename_);
debug("_");

function* exportW3CAnnotationWithFilePath(publicationIdentifier: string, filePath: string) {

    const pub = yield* callTyped(getPublication, publicationIdentifier);

    let annotations: IAnnotationState[] = [];

    const sessionReader = yield* selectTyped((state: RootState) => state.win.session.reader);
    const winSessionReaderState = Object.values(sessionReader).find((v) => v.publicationIdentifier === publicationIdentifier);
    if (winSessionReaderState) {
        annotations = (winSessionReaderState?.reduxState?.annotation || []).map(([,v]) => v);
    } else {
        const sessionRegistry = yield* selectTyped((state: RootState) => state.win.registry.reader);
        if (Object.keys(sessionRegistry).find((v) => v === publicationIdentifier)) {
            annotations = (sessionRegistry[publicationIdentifier]?.reduxState?.annotation || []).map(([, v]) => v);
        }
    }

    const publicationMetadata = yield* callTyped(convertPublicationToAnnotationStateAbout, pub, publicationIdentifier);
    const W3CAnnotationSet = yield* callTyped(convertAnnotationListToW3CAnnotationModelSet, annotations, publicationMetadata);

    yield* callTyped(saveW3CAnnotationModelSetFromFilePath, filePath, W3CAnnotationSet);
}

export function* exportW3CAnnotation(action: annotationActions.exportW3CAnnotationSetFromAnnotations.TAction) {

    const { publicationIdentifier } = action.payload;

    const libraryAppWindow = yield* callTyped(() => getLibraryWindowFromDi());

    // Open a dialog to select a folder then copy the publication in it
    const res = yield* callTyped(() => dialog.showOpenDialog(
        libraryAppWindow ? libraryAppWindow : undefined,
        {
            properties: ["openDirectory"],
        },
    ));

    if (!res.canceled) {
        if (res.filePaths && res.filePaths.length > 0) {
            let destinationPath = res.filePaths[0];
            // If the selected path is a file then choose the directory containing this file
            const stat = yield* callTyped(() => fsp.stat(destinationPath));
            if (stat?.isFile()) {
                destinationPath = path.join(path.dirname(destinationPath));
            }
            destinationPath = path.join(destinationPath, `${publicationIdentifier}.annotation`);
            yield* callTyped(exportW3CAnnotationWithFilePath, publicationIdentifier, destinationPath);
        }
    }
}


export function saga() {

    return takeSpawnLeading(
        annotationActions.exportW3CAnnotationSetFromAnnotations.ID,
        exportW3CAnnotation,
        (e) => error(filename_, e),
    );
}
