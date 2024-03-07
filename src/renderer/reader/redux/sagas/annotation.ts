// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { all, call, put, take} from "typed-redux-saga/macro";
import { select as selectTyped, take as takeTyped, race as raceTyped, SagaGenerator} from "typed-redux-saga";
import { readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionSetConfig, readerLocalActionSetLocator } from "../actions";
import { spawnLeading } from "readium-desktop/common/redux/sagas/spawnLeading";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";
import { IColor, TDrawType } from "readium-desktop/common/redux/states/renderer/annotation";
import { LocatorExtended, highlightsDrawMargin } from "@r2-navigator-js/electron/renderer";
import { HighlightDrawTypeBackground, HighlightDrawTypeOutline, HighlightDrawTypeStrikethrough, HighlightDrawTypeUnderline } from "r2-navigator-js/dist/es8-es2017/src/electron/common/highlight";
import { IHighlightHandlerState } from "readium-desktop/common/redux/states/renderer/highlight";

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

// focus from annotation menu
function* annotationFocus(action: readerLocalActionAnnotations.focus.TAction) {
    debug(`annotationFocus -- action: [${JSON.stringify(action.payload, null, 4)}]`);

    // const { payload: { uuid } } = action;

    // const { currentFocusUuid } = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.focus);
    // yield* put(readerLocalActionAnnotations.focusMode.build({previousFocusUuid: currentFocusUuid || "", currentFocusUuid: uuid, editionEnable: false}));
}

function* annotationUpdate(action: readerActions.annotation.update.TAction) {
    debug(`annotationUpdate-- handlerState: [${JSON.stringify(action.payload, null, 4)}]`);
    const {payload: {uuid, locatorExtended: {locator: {href}, selectionInfo}, color: newColor, drawType}} = action;

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

function* createAnnotation(locatorExtended: LocatorExtended, color: IColor, comment: string, drawType: TDrawType) {

    debug(`Create an annotation for, [${locatorExtended.selectionInfo.cleanText.slice(0, 10)}]`);
    yield* put(readerActions.annotation.push.build({
        color,
        comment,
        locatorExtended,
        drawType,
    }));

    // sure! close the popover
    yield* put(readerLocalActionAnnotations.enableMode.build(false, ""));
}

function* newLocatorEditAndSaveTheNote(locatorExtended: LocatorExtended): SagaGenerator<void> {
    const defaultColor = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultColor);
    const defaultDrawType = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_defaultDrawType);

    // check the boolean value of annotation_popoverNotOpenOnNoteTaking
    const annotation_popoverNotOpenOnNoteTaking = yield* selectTyped((state: IReaderRootState) => state.reader.config.annotation_popoverNotOpenOnNoteTaking);
    if (annotation_popoverNotOpenOnNoteTaking) {
        yield* call(createAnnotation, locatorExtended, {...defaultColor}, "", defaultDrawType);
        return;
    }

    // open popover to edit and save the note
    yield* put(readerLocalActionAnnotations.enableMode.build(true, locatorExtended.selectionInfo.cleanText.slice(0, 200)));

    // wait the action of the annotation popover, the user select the text, click on "take the note" button and then edit his note with the popover.
    // 2 choices: cancel (annotationModeEnabled = false) or takeNote with color and comment
    const { cancelAction, noteTakenAction } = yield* raceTyped({
        cancelAction: takeTyped(readerLocalActionAnnotations.enableMode.build),
        noteTakenAction: takeTyped(readerLocalActionAnnotations.createNote.build),
    });

    if (cancelAction) {
        debug("annotation canceled and not saved [not created]");
        return;
    } else if (noteTakenAction) {

        const { color, comment, drawType } = noteTakenAction.payload;
        debug(`annotation save the note with the color: ${color} and comment: ${comment.slice(0, 20)}`);

        // get color and comment and save the note
        yield* call(createAnnotation, locatorExtended, color, comment, drawType);
    } else {
        debug("ERROR: second yield RACE not worked !!?!!");
    }
}

function* newLocator(action: readerLocalActionSetLocator.TAction): SagaGenerator<void> {
    const locatorExtended = action.payload;
    const { selectionInfo, selectionIsNew } = locatorExtended;

    if (!selectionInfo || !selectionIsNew) {
        return;
    }

    debug(`New Selection Requested ! [${selectionInfo.cleanText.slice(0, 10)}]`);

    // check the boolean value of annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator
    const annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator = (window as any).__annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator || false;

    if (annotation_noteAutomaticallyCreatedOnNoteTakingAKASerialAnnotator) {
        yield* call(newLocatorEditAndSaveTheNote, locatorExtended);
        return ;
    }

    // wait the click on "take a note" button or call recursively this function to reload the wait of "take a note" button
    const { newLocatorAction, annotationBtnTriggerRequestedAction } = yield* raceTyped({
        newLocatorAction: takeTyped(readerLocalActionSetLocator.build),
        annotationBtnTriggerRequestedAction: takeTyped(readerLocalActionAnnotations.trigger.build),
    });

    if (newLocatorAction) {

        debug("new Locator requested, so we drop this annotation [not created]");

        yield* call(newLocator, newLocatorAction);

    } else if (annotationBtnTriggerRequestedAction) {

        debug("annotation trigger btn requested, creation of the annotation");

        yield* call(newLocatorEditAndSaveTheNote, locatorExtended);

    } else {
        debug("ERROR: yield RACE not worked !!?!!");
    }
}

function* newLocatorOrTriggerBtnWatcher() {

    const { newLocatorAction, annotationBtnTriggerRequestedAction } = yield* raceTyped({
        newLocatorAction: takeTyped(readerLocalActionSetLocator.build),
        annotationBtnTriggerRequestedAction: takeTyped(readerLocalActionAnnotations.trigger.build),
    });

    if (newLocatorAction) {

        yield* call(newLocator, newLocatorAction);

    } else if (annotationBtnTriggerRequestedAction) {

        debug(`annotationBtnTriggerRequestedAction received [${JSON.stringify(annotationBtnTriggerRequestedAction.payload, null, 4)}]`);
        // trigger a Toast notification to user
        yield* put(
            toastActions.openRequest.build(
                ToastType.Error,
                "No selection", // TODO: translation
            ),
        );
    }
}
// function* annotationEnableMode(action: readerLocalActionAnnotations.enableMode.TAction) {
//     const { payload: {enable}} = action;

//     debug(`annotationEnableMode enable=${enable}`);
//     if (enable) {
//         highlightsDrawMargin(false);
//         debug("annotation mode enabled ! draws highlight NOT in marging!");
//     } else {
//         highlightsDrawMargin(["annotation"]);
//         debug("annotation mode diasbled ! draws highlight IN marging!");
//     }
// }

// function* annotationFocusMode(action: readerLocalActionAnnotations.focusMode.TAction) {
//     debug("annotationMode (UI Edition and focus on current plus remove focus if any previous)");
    
//     const { payload: {previousFocusUuid, currentFocusUuid} } = action;

//     if (previousFocusUuid ) {
//         // disable with the new annotation margin mode, annotations are never deleted/unmounted
//         // const modeEnabled = yield* selectTyped((store: IReaderRootState) => store.annotationControlMode.mode.enable);
//         // if (!modeEnabled) {
//         //     debug(`annotation focus mode -- delete the highlight for previousFocusUUId=${previousFocusUuid}`);
//         //     yield* put(readerLocalActionHighlights.handler.pop.build([{ uuid: previousFocusUuid }]));
//         // }
//     }

//     if (currentFocusUuid) {

//         const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation);
//         const annotationItemQueue = annotations.find(([_, {uuid}]) => uuid === currentFocusUuid);
//         if (!annotationItemQueue) {
//             debug(`ERROR: annotation item not found [currentFocusId=${currentFocusUuid}`);
//         } else {
//             debug(`annotation focus mode -- highlight the new currentFocusUUId=${currentFocusUuid}`);

//             const annotationItem = annotationItemQueue[1]; // [timestamp, data]
//             const { uuid, locatorExtended: { locator: { href }, selectionInfo }, color } = annotationItem;

//             yield* put(readerLocalActionHighlights.handler.push.build([{ uuid, href, def: { selectionInfo, color, group: "annotation" } }]));
//         }
//     }
// }

function* readerStart() {

    debug("iframe reader viewport waiting to start...");

    yield* all([
        take(readerLocalActionSetLocator.build),
        take(winActions.initSuccess.build),
    ]);

    debug("annotation iframe reader viewport is started and ready to annotate, we draws all the annoatation for the first time with 'highlightsDrawMargin' enabled");

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

    debug(`captureHightlightDrawMargin : readerLocalActionSetConfig CHANGED apply=${annotation_defaultDrawView}`);
    if (annotation_defaultDrawView === "margin") {
        highlightsDrawMargin(["annotation"]);
    } else {
        highlightsDrawMargin(false);
    }
}

export const saga = () =>
    all([
        // takeSpawnEvery(
        //     readerLocalActionAnnotations.enableMode.ID,
        //     annotationEnableMode,
        //     (e) => console.error("readerLocalActionAnnotations.enableMode", e),
        // ),
        // takeSpawnEvery(
        //     readerLocalActionAnnotations.focusMode.ID,
        //     annotationFocusMode,
        //     (e) => console.error("readerLocalActionAnnotations.annotationFocusMode", e),
        // ),
        // takeSpawnEvery(
        //     readerLocalActionHighlights.click.ID,
        //     annotationClick,
        //     (e) => console.error("readerLocalActionHighlights.click", e),
        // ),
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
        takeSpawnEvery(
            readerLocalActionAnnotations.focus.ID,
            annotationFocus,
            (e) => console.error("readerLocalActionAnnotations.focus", e),
        ),
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
        spawnLeading(
            newLocatorOrTriggerBtnWatcher,
            (e) => console.error("newLocatorOrTriggerBtnWatcher", e),
        ),
        spawnLeading(
            readerStart,
            (e) => console.error("readerStart", e),
        ),
    ]);
