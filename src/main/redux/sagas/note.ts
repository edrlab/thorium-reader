// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { dialog } from "electron";
import { readFile } from "fs/promises";
import { ToastType } from "readium-desktop/common/models/toast";
import { annotationActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, put as putTyped, select as selectTyped, take as takeTyped, delay as delayTyped } from "typed-redux-saga/macro";
import { hexToRgb } from "readium-desktop/common/rgb";
import { isNil } from "readium-desktop/utils/nil";
import { RootState } from "../states";
import { __READIUM_ANNOTATION_AJV_ERRORS, isCFIFragmentSelector, isCfiSelector, isFragmentSelector, isIReadiumAnnotationSet, isTextPositionSelector, isTextQuoteSelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import path from "path";
import { getPublication } from "./api/publication/getPublication";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { v4 as uuidv4 } from "uuid";
import { takeSpawnLatest } from "readium-desktop/common/redux/sagas/takeSpawnLatest";
import { getTranslator } from "readium-desktop/common/services/translator";
import { EDrawType, INoteState, NOTE_DEFAULT_COLOR, noteColorCodeToColorSet, noteColorSetToColorCode } from "readium-desktop/common/redux/states/renderer/note";
import { winActions } from "../actions";
import { WINDOW_MIN_HEIGHT, WINDOW_MIN_WIDTH } from "readium-desktop/common/constant";


// Logger
const filename_ = "readium-desktop:main:saga:annotationsImporter";
const debug = debug_(filename_);
debug("_");

export function* getNotesFromMainWinState(publicationIdentifier: string): SagaGenerator<INoteState[]> {

    let notes: INoteState[] = [];
    const sessionReader = yield* selectTyped((state: RootState) => state.win.session.reader);
    const winSessionReaderStateArray = Object.values(sessionReader).filter((v) => v.publicationIdentifier === publicationIdentifier);
    if (winSessionReaderStateArray.length) {
        const winSessionReaderStateFirst = winSessionReaderStateArray[0]; // TODO: get the first only !?!
        notes = winSessionReaderStateFirst?.reduxState?.note || [];

        debug("current publication AnnotationsList come from the readerSession (there are one or many readerWin currently open)");
    } else {
        const sessionRegistry = yield* selectTyped((state: RootState) => state.win.registry.reader);
        if (Object.keys(sessionRegistry).find((v) => v === publicationIdentifier)) {
            notes = sessionRegistry[publicationIdentifier]?.reduxState?.note || [];

            debug("current publication AnnotationsList come from the readerRegistry (no readerWin currently open)");
        }
    }
    debug("There are", notes.length, "annotation(s) loaded from the current publicationIdentifier");
    if (!notes.length) {
        debug("Be careful, there are no annotation loaded for this publication!");
    }

    return notes;
}

function* pushNotesFromMainWindow(publicationIdentifier: string, notes: INoteState[]): SagaGenerator<void> {

    const sessionReader = yield* selectTyped((state: RootState) => state.win.session.reader);
    const winSessionReaderStateArray = Object.values(sessionReader).filter((v) => v.publicationIdentifier === publicationIdentifier);

    if (winSessionReaderStateArray.length) {
        // dispatch action
        for (const note of notes) {
            yield* delayTyped(1);
            yield* putTyped(readerActions.note.addUpdate.build(publicationIdentifier, note));
        }

    } else {
        const sessionRegistry = yield* selectTyped((state: RootState) => state.win.registry.reader);
        const reduxState = sessionRegistry[publicationIdentifier]?.reduxState || {};
        reduxState.note = [...(reduxState.note || []), ...notes];
        const winBound = sessionRegistry[publicationIdentifier]?.windowBound || { height: WINDOW_MIN_HEIGHT, width: WINDOW_MIN_WIDTH, x: 0, y: 0 };

        yield* putTyped(winActions.registry.registerReaderPublication.build(
            publicationIdentifier,
            winBound,
            reduxState),
        );
    }
}

function* importAnnotationSet(action: annotationActions.importAnnotationSet.TAction): SagaGenerator<void> {

    const { payload: { publicationIdentifier, winId } } = action;
    debug("Start annotations Importer");
    const { __ } = getTranslator();

    const readerPublicationIdentifier = winId ? publicationIdentifier : undefined; // if undefined toast notification will be displayed in library win
    const currentTimestamp = (new Date()).getTime();

    const win = winId ? getReaderWindowFromDi(winId) : getLibraryWindowFromDi();

    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
        debug("ERROR!! No Browser window !!! exit");
        return;
    }

    let filePath = "";
    try {

        debug("Open ShowOpenDialog and ask to user the filePath");
        const res = yield* callTyped(() => dialog.showOpenDialog(win, { filters: [{ extensions: ["annotation"], name: "Readium Annotation Set (.annotation)" }], properties: ["openFile"] }));

        if (!res.canceled) {
            filePath = res.filePaths[0] || "";

        }
    } catch (e) {
        debug("Error!!! to open a file, exit", e);
        yield* putTyped(toastActions.openRequest.build(ToastType.Error, "" + e, readerPublicationIdentifier));
        return;
    }

    debug("FilePath=", filePath);
    const fileName = path.basename(filePath).slice(0, -1 * ".annotation".length);

    try {

        // read filePath
        const dataString = yield* callTyped(() => readFile(filePath, { encoding: "utf8" }));
        const readiumAnnotationFormat = JSON.parse(dataString);
        debug("filePath size=", dataString.length);
        debug("filePath serialized and ready to pass the type checker");

        if (!isIReadiumAnnotationSet(readiumAnnotationFormat)) {

            debug("Error: ", __READIUM_ANNOTATION_AJV_ERRORS);
            yield* putTyped(toastActions.openRequest.build(ToastType.Error, __("message.annotations.errorParsing") + __READIUM_ANNOTATION_AJV_ERRORS, readerPublicationIdentifier));
            return;
        }

        debug("filePath pass the typeChecker (ReadiumAnnotationModelSet)");

        const data = readiumAnnotationFormat;
        const annotationsIncommingArray = data.items;

        if (!annotationsIncommingArray.length) {
            debug("there are no annotations in the file, exit");
            yield* putTyped(toastActions.openRequest.build(ToastType.Success, __("message.annotations.emptyFile"), readerPublicationIdentifier));
            return;
        }


        // we just check if each annotation href source belongs to the R2Publication Spine items
        // if at least one annotation in the list doesn't match with the current spine item, then reject the set importation

        const pubView = yield* callTyped(getPublication, publicationIdentifier);
        const r2PublicationJson = pubView.r2PublicationJson;
        const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);
        const spineItem = r2Publication.Spine;
        const hrefFromSpineItem = spineItem.map((v) => v.Href);
        debug("Current Publcation (", publicationIdentifier, ") SpineItems(hrefs):", hrefFromSpineItem);
        const annotationsIncommingArraySourceHrefs = annotationsIncommingArray.map(({ target: { source } }) => source);
        debug("Incomming Annotations target.source(hrefs):", annotationsIncommingArraySourceHrefs);
        const annotationsIncommingMatchPublicationSpineItem = annotationsIncommingArraySourceHrefs.reduce((acc, source) => {
            return acc && hrefFromSpineItem.includes(source);
        }, true);

        if (!annotationsIncommingMatchPublicationSpineItem) {

            debug("ERROR: At least one annotation is rejected and not match with the current publication SpineItem, see above");
            yield* putTyped(toastActions.openRequest.build(ToastType.Error, __("message.annotations.noBelongTo"), readerPublicationIdentifier));
            return;
        }

        debug("GOOD ! spineItemHref matched : publication identified, let's continue the importation");

        // OK publication identified
        const notes = yield* callTyped(getNotesFromMainWinState, publicationIdentifier);

        const annotationsParsedNoConflictArray: INoteState[] = [];
        const annotationsParsedConflictOlderArray: INoteState[] = [];
        const annotationsParsedConflictNewerArray: INoteState[] = [];
        const annotationsParsedAllArray: INoteState[] = [];

        debug("There are", annotationsIncommingArray.length, "incomming annotations to be imported");

        // loop on each annotation to check conflicts and import it
        for (const incommingAnnotation of annotationsIncommingArray) {

            const textQuoteSelector = incommingAnnotation.target.selector.find(isTextQuoteSelector);
            const textPositionSelector = incommingAnnotation.target.selector.find(isTextPositionSelector);
            const cfiSelector = incommingAnnotation.target.selector.find(isCfiSelector);
            const fragmentSelectorArray = incommingAnnotation.target.selector.filter(isFragmentSelector);
            const cfiFragmentSelector = fragmentSelectorArray.find(isCFIFragmentSelector);
            const creator = incommingAnnotation.creator;
            const uuid = incommingAnnotation.id.split("urn:uuid:")[1] || uuidv4(); // TODO : may not be an uuid format and maybe we should hash the uuid to get a unique identifier based on the original uuid

            if (cfiFragmentSelector) {
                debug(`for ${uuid} a CFI Fragment selector is available (${JSON.stringify(cfiFragmentSelector, null, 4)})`);
            }

            if (cfiSelector) {
                debug(`for ${uuid} a CFI selector is available (${JSON.stringify(cfiSelector, null, 4)})`);
            }

            // check if thorium selector available
            if (!(textQuoteSelector || textPositionSelector || cfiFragmentSelector || cfiSelector)) {
                debug(`for ${uuid} no selector available (TextQuote/TextPosition)`);
                continue;
            }

            const annotationParsed: INoteState = {
                uuid,
                index: -1, // TODO !!!!
                textualValue: incommingAnnotation.body?.value,
                color: hexToRgb(noteColorSetToColorCode[incommingAnnotation.body?.color] ||
                    noteColorSetToColorCode[noteColorCodeToColorSet[incommingAnnotation.body?.color] || NOTE_DEFAULT_COLOR],
                ),
                drawType: EDrawType[(isNil(incommingAnnotation.body?.highlight) || incommingAnnotation.body?.highlight === "solid") ? "solid_background" : incommingAnnotation.body.highlight] || EDrawType.solid_background,
                // TODO need to ask to user if the incomming tag is kept or the fileName is used
                tags: [fileName], // incommingAnnotation.body?.tag ? [incommingAnnotation.body?.tag] : [],
                modified: incommingAnnotation.modified ? tryCatchSync(() => new Date(incommingAnnotation.modified).getTime(), fileName) : undefined,
                created: tryCatchSync(() => new Date(incommingAnnotation.created).getTime(), fileName) || currentTimestamp,
                creator: creator?.id ? {
                    id: creator.id,
                    urn: creator.id, // readium annotation schema ensure that it is a urn
                    type: creator.type,
                    name: creator.name,
                } : undefined,
                group: incommingAnnotation.motivation === "bookmarking" ? "bookmark" : "annotation",
                readiumAnnotation: {
                    import: { target: incommingAnnotation.target },
                },
            };

            if (annotationParsed.modified) {
                if (annotationParsed.modified > currentTimestamp) {
                    annotationParsed.modified = currentTimestamp;
                }
                if (annotationParsed.created > annotationParsed.modified) {
                    annotationParsed.modified = currentTimestamp;
                }
            }
            if (annotationParsed.created > currentTimestamp) {
                annotationParsed.created = currentTimestamp;
            }

            debug("incomming annotation Parsed And Formated (", annotationParsed.uuid, "), and now ready to be imported in the publication!");
            debug(JSON.stringify(annotationParsed));

            annotationsParsedAllArray.push(annotationParsed);

            const annotationSameUUIDFound = notes.find(({ uuid }) => uuid === annotationParsed.uuid);
            if (annotationSameUUIDFound) {

                if (annotationSameUUIDFound.modified && annotationParsed.modified) {

                    if (annotationSameUUIDFound.modified < annotationParsed.modified) {
                        annotationsParsedConflictNewerArray.push(annotationParsed);
                    }
                    if (annotationSameUUIDFound.modified > annotationParsed.modified) {
                        annotationsParsedConflictOlderArray.push(annotationParsed);
                    }

                } else if (annotationSameUUIDFound.modified) {
                    annotationsParsedConflictOlderArray.push(annotationParsed);

                } else if (annotationParsed.modified) {
                    annotationsParsedConflictNewerArray.push(annotationParsed);
                }
            } else {

                annotationsParsedNoConflictArray.push(annotationParsed);
            }
        }

        if (!annotationsParsedAllArray.length) {

            debug("there are no annotations ready to be imported, exit");
            yield* putTyped(toastActions.openRequest.build(ToastType.Success, __("message.annotations.nothing"), readerPublicationIdentifier));
            return;

        }

        if (!(annotationsParsedConflictNewerArray.length || annotationsParsedConflictOlderArray.length || annotationsParsedNoConflictArray.length)) {

            debug("all annotations are already imported, exit");
            yield* putTyped(toastActions.openRequest.build(ToastType.Success, __("message.annotations.alreadyImported"), readerPublicationIdentifier));
            return;
        }


        // dispatch data to the user modal
        yield* putTyped(annotationActions.importTriggerModal.build(
            {
                about: data.about ? { ...data.about } : undefined,
                title: data.title || "",
                generated: data.generated || "",
                generator: data.generator ? { ...data.generator } : undefined,
                annotationsList: annotationsParsedNoConflictArray,
                annotationsConflictListOlder: annotationsParsedConflictOlderArray,
                annotationsConflictListNewer: annotationsParsedConflictNewerArray,
                winId,
            },
        ));

        // wait the modal confirmation or abort
        const actionConfirmOrAbort = yield* takeTyped(annotationActions.importConfirmOrAbort.build); // not .ID because we need Action return type
        if (!actionConfirmOrAbort?.payload || actionConfirmOrAbort.payload.state === "abort") {
            // aborted

            debug("ABORTED, exit");
            return;
        }

        // const annotationsParsedConflictNeedToBeUpdated = [...annotationsParsedConflictNewerArray, ...annotationsParsedConflictOlderArray];
        const annotationsParsedReadyToBeImportedArray = actionConfirmOrAbort.payload.state === "importNoConflict"
            ? annotationsParsedNoConflictArray
            : [...annotationsParsedNoConflictArray, ...annotationsParsedConflictOlderArray, ...annotationsParsedConflictNewerArray];

        debug("ready to send", annotationsParsedReadyToBeImportedArray.length, "annotation(s) to the annotationImportQueue processed to the reader");


        // push notes to the publicationIdentifier redux-state (reader if open or redux-registry-main state instead)
        yield* callTyped(pushNotesFromMainWindow, publicationIdentifier, annotationsParsedReadyToBeImportedArray);

        // convert range to locator IRangeInfo/selectionInfo
        // ref: https://github.com/readium/r2-navigator-js/blob/a08126622ac87e04200a178cc438fd7e1b256c52/src/electron/renderer/webview/selection.ts#L342


    } catch (e) {
        debug("Error to read the file: ", e);
        if (e?.path !== "") {
            yield* putTyped(toastActions.openRequest.build(ToastType.Error, "" + e, readerPublicationIdentifier));
        }
        return;
    }

    debug("Annotations importer success and exit");
    yield* putTyped(toastActions.openRequest.build(ToastType.Success, __("message.annotations.success"), readerPublicationIdentifier));
    return;
}


export function saga() {
    return takeSpawnLatest(
        annotationActions.importAnnotationSet.ID,
        importAnnotationSet,
        (e) => error(filename_, e),
    );
}
