// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { all, call, put, select, take} from "typed-redux-saga/macro";
import { select as selectTyped, take as takeTyped, race as raceTyped, SagaGenerator, call as callTyped} from "typed-redux-saga";
import { readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionSetConfig, readerLocalActionSetLocator } from "../actions";
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
import { diReaderGet } from "../../di";

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
//         // yield* put(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: true}));
//     }
// }

// // focus from annotation menu
// function* annotationFocus(action: readerLocalActionAnnotations.focus.TAction) {
//     debug(`annotationFocus -- action: [${JSON.stringify(action.payload, null, 4)}]`);

//     // const { payload: { uuid } } = action;

//     // const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
//     // yield* put(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: false}));
// }

function* annotationUpdate(action: readerActions.annotation.update.TAction) {
    debug(`annotationUpdate-- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);

    const [_, newAnnot] = action.payload;
    const {uuid, locatorExtended: {locator: {href}, selectionInfo}, color: newColor, drawType, tags: _tags} = newAnnot;

    const item = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler.find(([_, highlightState]) => highlightState.uuid === uuid));

    if (item) {
        const { def: { color: previousColor, drawType: previousDrawType } } = item[1];

        if (previousColor.blue !== newColor.blue || previousColor.green !== newColor.green || previousColor.red !== newColor.red || convertDrawTypeToNumber(drawType) !== previousDrawType) {
            yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid }]));
            yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color: newColor, group: "annotation", drawType: convertDrawTypeToNumber(drawType) } }]));
        }
    } else {
        // error sync between hightlight data array and annotation array
        yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid }]));
    }
}

function* annotationPush(action: readerActions.annotation.push.TAction) {

    debug(`annotationPush : [${JSON.stringify(action.payload, null, 4)}]`);
    const {payload: {uuid, locatorExtended: {locator: {href}, selectionInfo}, color, drawType}} = action;

    yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color, group: "annotation", drawType: convertDrawTypeToNumber(drawType) } }]));
}

function* annotationPop(action: readerActions.annotation.pop.TAction) {
    debug(`annotationPop : [${action.payload.uuid}]`);

    const {
        uuid,
    } = action.payload;

    yield* put(readerLocalActionHighlights.handler.pop.build([{uuid}]));
}

function* createAnnotation(locatorExtended: MiniLocatorExtended, color: IColor, comment: string, drawType: TDrawType, tags: string[]) {

    // clean __selection global variable state
    __selectionInfoGlobal.locatorExtended = undefined;

    const creator = yield* select((state: IReaderRootState) => state.creator);

    debug(`Create an annotation for, [${locatorExtended.selectionInfo.cleanText.slice(0, 10)}]`);
    yield* put(readerActions.annotation.push.build({
        color,
        comment,
        locatorExtended,
        drawType,
        tags,
        creator: {
            id: creator.id,
            type: creator.type, // not used but required https://github.com/readium/annotations/?tab=readme-ov-file#11-creator
        },
    }));

    // sure! close the popover
    yield* put(readerLocalActionAnnotations.enableMode.build(false, undefined));
}

function* newLocatorEditAndSaveTheNote(locatorExtended: MiniLocatorExtended): SagaGenerator<void> {
    const defaultColor = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultColor);
    const defaultDrawType = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawType);

    // check the boolean value of annotation_popoverNotOpenOnNoteTaking
    const annotation_popoverNotOpenOnNoteTaking = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_popoverNotOpenOnNoteTaking);
    if (annotation_popoverNotOpenOnNoteTaking) {
        yield* call(createAnnotation, locatorExtended, {...defaultColor}, "", defaultDrawType, []);
        return;
    }

    // open popover to edit and save the note
    yield* put(readerLocalActionAnnotations.enableMode.build(true, locatorExtended));

    // wait the action of the annotation popover, the user select the text, click on "take the note" button and then edit his note with the popover.
    // 2 choices: cancel (annotationModeEnabled = false) or takeNote with color and comment
    const { cancelAction, noteTakenAction } = yield* raceTyped({
        cancelAction: takeTyped(readerLocalActionAnnotations.enableMode.build),
        noteTakenAction: takeTyped(readerLocalActionAnnotations.createNote.build),
    });

    if (cancelAction) {
        debug("annotation canceled and not saved [not created]");

        // __selectionInfoGlobal.locatorExtended is not yet cleaned, ready to re-trigger the note creation
        return;
    } else if (noteTakenAction) {

        const { color, comment, drawType, tags } = noteTakenAction.payload;
        debug(`annotation save the note with the color: ${color} , comment: ${comment.slice(0, 20)} , drawType: ${drawType} , tags: ${tags}`);


        // get color and comment and save the note
        yield* call(createAnnotation, locatorExtended, color, comment, drawType, tags);

    } else {
        debug("ERROR: second yield RACE not worked !!?!!");
    }
}

function* annotationButtonTrigger(_action: readerLocalActionAnnotations.trigger.TAction) {

    const { locatorExtended } = __selectionInfoGlobal;
    if (!locatorExtended) {
        const translator = yield* callTyped(
            () => diReaderGet("translator"));

        debug("annotationBtnTriggerRequestedAction received");
        // trigger a Toast notification to user
        yield* put(
            toastActions.openRequest.build(
                ToastType.Error,
                translator.translate("reader.annotations.noSelectionToast"),
            ),
        );
        return ;
    }

    debug("annotation trigger btn requested, create annotation");
    yield* call(newLocatorEditAndSaveTheNote, locatorExtended);

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
        yield* call(newLocatorEditAndSaveTheNote, locatorExtended);
        return ;
    }
}

function* readerStart() {

    debug("iframe reader viewport waiting to start...");

    yield* all([
        take(readerLocalActionSetLocator.build),
        take(winActions.initSuccess.build),
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
        highlightsDrawMargin(["annotation"]);
    } else {
        highlightsDrawMargin(false);
    }

    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
    const annotationsUuids = annotations.map(([_, annotationState]) => ({ uuid: annotationState.uuid }));
    yield* put(readerLocalActionHighlights.handler.pop.build(annotationsUuids));

    const annotationsHighlighted: IHighlightHandlerState[] = annotations.map(
        ([_, { uuid, locatorExtended: { locator: { href }, selectionInfo }, color, drawType}]) =>
            ({ uuid, href, def: { selectionInfo, color, group: "annotation", drawType: convertDrawTypeToNumber(drawType) }}));

    yield* put(readerLocalActionHighlights.handler.push.build(annotationsHighlighted));

    debug(`${annotationsHighlighted.length} annotation(s) drawn`);
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
        highlightsDrawMargin(["annotation"]);
    } else {
        highlightsDrawMargin(false);
    }
}

export const saga = () =>
    all([
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
