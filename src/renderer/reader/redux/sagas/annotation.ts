// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { SagaGenerator } from "typed-redux-saga";
import { select as selectTyped, take as takeTyped, race as raceTyped, put as putTyped, all as allTyped, call as callTyped } from "typed-redux-saga/macro";
import { readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionLocatorHrefChanged, readerLocalActionSetConfig, readerLocalActionSetLocator } from "../actions";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";
import { IColor, TDrawType } from "readium-desktop/common/redux/states/renderer/annotation";

import { highlightsDrawMargin } from "@r2-navigator-js/electron/renderer";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

import { HighlightDrawTypeBackground, HighlightDrawTypeOutline, HighlightDrawTypeStrikethrough, HighlightDrawTypeUnderline } from "@r2-navigator-js/electron/common/highlight";
import { IHighlightHandlerState } from "readium-desktop/common/redux/states/renderer/highlight";
import { getTranslator } from "readium-desktop/common/services/translator";

// Logger
const debug = debug_("readium-desktop:renderer:reader:redux:sagas:annotation");
debug("_");

const convertDrawTypeToNumber = (drawType: TDrawType) => {
    return drawType === "solid_background" ? HighlightDrawTypeBackground : drawType === "outline" ? HighlightDrawTypeOutline : drawType === "strikethrough" ? HighlightDrawTypeStrikethrough : drawType === "underline" ? HighlightDrawTypeUnderline : HighlightDrawTypeBackground;
};

// click from highlight
// function* annotationClick(action: readerLocalActionHighlights.click.TAction) {
//     const { uuid, def: {group} } = action.payload;
//     if (uuid && group === "annotation") {
//         debug(`highlightClick ACTION (will focus) -- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);

//         // const { payload: { uuid } } = action;

//         // const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
//         // yield* putTyped(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: true}));
//     }
// }

// // focus from annotation menu
// function* annotationFocus(action: readerLocalActionAnnotations.focus.TAction) {
//     debug(`annotationFocus -- action: [${JSON.stringify(action.payload, null, 4)}]`);

//     // const { payload: { uuid } } = action;

//     // const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
//     // yield* putTyped(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: false}));
// }

function* annotationUpdate(action: readerActions.annotation.update.TAction) {
    debug(`annotationUpdate-- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);

    const [_, newAnnot] = action.payload;
    const {uuid, locatorExtended: {locator: {href}, selectionInfo}, color: newColor, drawType, tags: _tags} = newAnnot;

    const item = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler.find(([_, highlightState]) => highlightState.uuid === uuid));

    if (item) {
        const { def: { color: previousColor, drawType: previousDrawType } } = item[1];

        if (previousColor.blue !== newColor.blue || previousColor.green !== newColor.green || previousColor.red !== newColor.red || convertDrawTypeToNumber(drawType) !== previousDrawType) {
            yield* putTyped(readerLocalActionHighlights.handler.pop.build([{ uuid }]));
            yield* putTyped(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color: newColor, group: "annotation", drawType: convertDrawTypeToNumber(drawType) } }]));
        }
    } else {
        // error sync between hightlight data array and annotation array
        yield* putTyped(readerLocalActionHighlights.handler.pop.build([{ uuid }]));
    }
}

function* annotationPush(action: readerActions.annotation.push.TAction) {

    debug(`annotationPush : [${JSON.stringify(action.payload, null, 4)}]`);
    const {payload: {uuid, locatorExtended: {locator: {href}, selectionInfo}, color, drawType}} = action;

    yield* putTyped(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color, group: "annotation", drawType: convertDrawTypeToNumber(drawType) } }]));
}

function* annotationPop(action: readerActions.annotation.pop.TAction) {
    debug(`annotationPop : [${action.payload.uuid}]`);

    const {
        uuid,
    } = action.payload;

    yield* putTyped(readerLocalActionHighlights.handler.pop.build([{uuid}]));
}

function* createAnnotation(locatorExtended: MiniLocatorExtended, color: IColor, comment: string, drawType: TDrawType, tags: string[]) {

    // clean __selection global variable state
    __selectionInfoGlobal.locatorExtended = undefined;

    const creator = yield* selectTyped((state: IReaderRootState) => state.creator);

    debug(`Create an annotation for, [${locatorExtended.selectionInfo.cleanText.slice(0, 10)}]`);
    yield* putTyped(readerActions.annotation.push.build({
        color,
        comment,
        locatorExtended,
        drawType,
        tags,
        creator: {
            id: creator.id,
            type: creator.type, // not used, only the id is used to target the self creator ,, but required in models : https://github.com/readium/annotations/?tab=readme-ov-file#11-creator
        },
        created: (new Date()).getTime(),
    }));

    // sure! close the popover
    yield* putTyped(readerLocalActionAnnotations.enableMode.build(false, undefined));
}

function* newLocatorEditAndSaveTheNote(locatorExtended: MiniLocatorExtended): SagaGenerator<void> {
    const defaultColor = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultColor);
    const defaultDrawType = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawType);

    // check the boolean value of annotation_popoverNotOpenOnNoteTaking
    const annotation_popoverNotOpenOnNoteTaking = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_popoverNotOpenOnNoteTaking);
    if (annotation_popoverNotOpenOnNoteTaking) {
        yield* callTyped(createAnnotation, locatorExtended, {...defaultColor}, "", defaultDrawType, []);
        return;
    }

    // open popover to edit and save the note
    yield* putTyped(readerLocalActionAnnotations.enableMode.build(true, locatorExtended));

    // wait the action of the annotation popover, the user select the text, click on "take the note" button and then edit his note with the popover.
    // 2 choices: cancel (annotationModeEnabled = false) or takeNote with color and comment
    const { cancelAction, noteTakenAction } = yield* raceTyped({
        cancelAction: takeTyped(readerLocalActionAnnotations.enableMode.ID),
        noteTakenAction: takeTyped(readerLocalActionAnnotations.createNote.build), // not .ID because we need Action return type
    });

    if (cancelAction) {
        debug("annotation canceled and not saved [not created]");

        // __selectionInfoGlobal.locatorExtended is not yet cleaned, ready to re-trigger the note creation
        return;
    } else if (noteTakenAction) {

        const { color, comment, drawType, tags } = noteTakenAction.payload;
        debug(`annotation save the note with the color: ${color} , comment: ${comment.slice(0, 20)} , drawType: ${drawType} , tags: ${tags}`);


        // get color and comment and save the note
        yield* callTyped(createAnnotation, locatorExtended, color, comment, drawType, tags);

    } else {
        debug("ERROR: second yield RACE not worked !!?!!");
    }
}

function* annotationButtonTrigger(_action: readerLocalActionAnnotations.trigger.TAction) {
    const defaultDrawView = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawView);
    if (defaultDrawView === "hide") { // NOT "margin" or "annotation"
        yield* putTyped(readerLocalActionSetConfig.build({ annotation_defaultDrawView: "annotation" }));

        const currentLocation = yield* selectTyped((state: IReaderRootState) => state.reader.locator);
        const href1 = currentLocation?.locator?.href;
        const href2 = currentLocation?.secondWebViewHref;
        yield* putTyped(readerLocalActionLocatorHrefChanged.build(href1, href1, href2, href2));
    }

    const { locatorExtended } = __selectionInfoGlobal;
    if (!locatorExtended) {
        debug("annotationBtnTriggerRequestedAction received");
        // trigger a Toast notification to user
        yield* putTyped(
            toastActions.openRequest.build(
                ToastType.Error,
                getTranslator().__("reader.annotations.noSelectionToast"),
            ),
        );
        return ;
    }

    debug("annotation trigger btn requested, create annotation");
    yield* callTyped(newLocatorEditAndSaveTheNote, locatorExtended);

}

const __selectionInfoGlobal: {locatorExtended: MiniLocatorExtended | undefined} = {locatorExtended: undefined};
function* setLocator(action: readerLocalActionSetLocator.TAction) {

    const locatorExtended = action.payload;
    const { selectionInfo, selectionIsNew } = locatorExtended;

    if (!selectionInfo) {
        __selectionInfoGlobal.locatorExtended = undefined;
        return;
    }

    debug(`${selectionIsNew ? "New" : "Old"} Selection Requested ! [${selectionInfo.cleanText.slice(0, 50)}...]`);
    __selectionInfoGlobal.locatorExtended = locatorExtended;

    // check the boolean value of annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator
    const annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator = (window as any).__annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator || false;

    if (annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator) {
        yield* callTyped(newLocatorEditAndSaveTheNote, locatorExtended);
        return ;
    }
}

function* readerStart() {

    debug("iframe reader viewport waiting to start...");

    yield* allTyped([
        takeTyped(readerLocalActionSetLocator.ID),
        takeTyped(winActions.initSuccess.ID),
    ]);

    // divina,
    const { info, locator } = yield* selectTyped((state: IReaderRootState) => state.reader);
    // typeof divina !== "undefined" ||
    const skip = info?.publicationView?.isDivina ||
        locator?.audioPlaybackInfo || info?.publicationView?.isAudio ||
        info?.publicationView?.isPDF;
    if (skip) {
        // divina,
        debug("readerStart SKIP annot", skip, info?.publicationView?.isDivina, locator?.audioPlaybackInfo, info?.publicationView?.isAudio, info?.publicationView?.isPDF);
        return;
    }

    debug("annotation iframe reader viewport is started and ready to annotate, we draws all the annotation for the first time with 'highlightsDrawMargin' enabled");

    const { annotation_defaultDrawView } = yield* selectTyped((state: IReaderRootState) => state.reader.config);
    if (annotation_defaultDrawView === "margin") {
        highlightsDrawMargin(["annotation", "bookmark"]);
    } else {
        highlightsDrawMargin(["bookmark"]);
    }

    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
    const annotationsUuids = annotations.map(([_, annotationState]) => ({ uuid: annotationState.uuid }));
    yield* putTyped(readerLocalActionHighlights.handler.pop.build(annotationsUuids));

    const annotationsHighlighted: IHighlightHandlerState[] = annotations.map(
        ([_, { uuid, locatorExtended: { locator: { href }, selectionInfo }, color, drawType}]) =>
            ({ uuid, href, def: { selectionInfo, color, group: "annotation", drawType: convertDrawTypeToNumber(drawType) }} satisfies IHighlightHandlerState));
    // yield* putTyped(readerLocalActionHighlights.handler.push.build(annotationsHighlighted));

    debug(`${annotationsHighlighted.length} annotation(s) to draw`);

    const bookmarks = yield* selectTyped((store: IReaderRootState) => store.reader.bookmark);
    const bookmarksUuids = bookmarks.map(([_, bookmarkState]) => ({ uuid: bookmarkState.uuid }));
    yield* putTyped(readerLocalActionHighlights.handler.pop.build(bookmarksUuids));

    const bookmarksUuidsHighlighted: IHighlightHandlerState[] = bookmarks.map(
        ([_, bookmark]) =>
            (
                {
                    uuid: bookmark.uuid,
                    href: bookmark.locator.href,
                    def: {
                        selectionInfo: {
                            // @ts-expect-error not sure why??!
                            textFragment: undefined,
                            // textFragment: {
                            //     prefix: "",
                            //     textStart: "",
                            //     textEnd: "",
                            //     suffix: "",
                            // },
                            rangeInfo: bookmark.locator.locations.rangeInfo || {
                                startContainerElementCssSelector: bookmark.locator.locations.cssSelector,
                                startContainerElementCFI: undefined,
                                startContainerElementXPath: undefined,
                                startContainerChildTextNodeIndex: -1,
                                startOffset: -1,
                                endContainerElementCssSelector: bookmark.locator.locations.cssSelector,
                                endContainerElementCFI: undefined,
                                endContainerElementXPath: undefined,
                                endContainerChildTextNodeIndex: -1,
                                endOffset: -1,
                                cfi: undefined,
                            },
                            cleanBefore: bookmark.locator.text?.before || "",
                            cleanText: bookmark.locator.text?.highlight || bookmark.locator.title || bookmark.name,
                            cleanAfter: bookmark.locator.text?.after || "",
                            rawBefore: bookmark.locator.text?.beforeRaw || "",
                            rawText: bookmark.locator.text?.highlightRaw || bookmark.locator.title || bookmark.name,
                            rawAfter: bookmark.locator.text?.afterRaw || "",
                        },
                        color: {red:  52, green: 152, blue: 219},
                        group: "bookmark",
                        drawType: 6,
                    },
                } satisfies IHighlightHandlerState
            ),
    );
    // yield* putTyped(readerLocalActionHighlights.handler.push.build(bookmarksUuidsHighlighted));

    debug(`${bookmarksUuidsHighlighted.length} bookmark(s) to draw`);

    yield* putTyped(readerLocalActionHighlights.handler.push.build(annotationsHighlighted.concat(bookmarksUuidsHighlighted)));

    debug(`${annotationsHighlighted.length + bookmarksUuidsHighlighted.length} bookmark(s) and annotation(s) drawn`);
}

function* captureHightlightDrawMargin(action: readerLocalActionSetConfig.TAction) {

    const { annotation_defaultDrawView } = action.payload;
    if (!annotation_defaultDrawView) return ;

    // divina,
    const { info, locator } = yield* selectTyped((state: IReaderRootState) => state.reader);
    // typeof divina !== "undefined" ||
    const skip = info?.publicationView?.isDivina ||
        locator?.audioPlaybackInfo || info?.publicationView?.isAudio ||
        info?.publicationView?.isPDF;
    if (skip) {
        // divina,
        debug("captureHightlightDrawMargin SKIP annot", skip, info?.publicationView?.isDivina, locator?.audioPlaybackInfo, info?.publicationView?.isAudio, info?.publicationView?.isPDF);
        return;
    }

    debug(`captureHightlightDrawMargin : readerLocalActionSetConfig CHANGED apply=${annotation_defaultDrawView}`);
    if (annotation_defaultDrawView === "margin") {
        highlightsDrawMargin(["annotation", "bookmark"]);
    } else {
        highlightsDrawMargin(["bookmark"]);
    }
}

export const saga = () =>
    allTyped([
        takeSpawnEvery(
            readerLocalActionSetConfig.ID,
            captureHightlightDrawMargin,
            (e) => console.error("readerLocalActionSetConfig", e),
        ),
        takeSpawnEvery(
            readerActions.annotation.update.ID,
            annotationUpdate,
            (e) => console.error("readerLocalActionAnnotations.update", e),
        ),
        // takeSpawnEvery(
        //     readerLocalActionAnnotations.focus.ID,
        //     annotationFocus,
        //     (e) => console.error("readerLocalActionAnnotations.focus", e),
        // ),
        takeSpawnEvery(
            readerActions.annotation.push.ID,
            annotationPush,
            (e) => console.error("readerLocalActionAnnotations.push", e),
        ),
        takeSpawnEvery(
            readerActions.annotation.pop.ID,
            annotationPop,
            (e) => console.error("readerLocalActionAnnotations.pop", e),
        ),
        takeSpawnEvery(
            readerLocalActionSetLocator.ID,
            setLocator,
            (e) => console.error("readerLocalActionSetLocator", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.trigger.ID,
            annotationButtonTrigger,
            (e) => console.error("readerLocalActionAnnotations.trigger", e),
        ),
        spawnLeading(
            readerStart,
            (e) => console.error("readerStart", e),
        ),
    ]);
