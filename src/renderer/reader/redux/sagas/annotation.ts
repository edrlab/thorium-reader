// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as assert from "assert";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { SagaIterator } from "redux-saga";

import { readerLocalActionAnnotationUI, readerLocalActionAnnotations, readerLocalActionHighlights, readerLocalActionPicker, readerLocalActionSetLocator } from "../actions";
import { IHighlightHandlerState } from "readium-desktop/common/redux/states/renderer/highlight";
import { all, put as putTyped, select as selectTyped, call as callTyped } from "typed-redux-saga";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { IAnnotationStateWithoutUUID } from "readium-desktop/common/redux/states/annotation";
import { IHighlightDefinition } from "r2-navigator-js/dist/es8-es2017/src/electron/common/highlight";
import { readerActions } from "readium-desktop/common/redux/actions";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:annotation";
const debug = debug_(filename_);
debug("_");

const hashing = (href: string, def: IHighlightDefinition) => {

    const defCopy = Object.assign({}, def);
    defCopy.color = undefined;
    const str = `${href}:${JSON.stringify(defCopy)}`;
    const hash = crypto.subtle.digest("SHA-256", Buffer.from(str))
        .then((a) => Buffer.from(a).toString("hex"));

    return hash;
};

function createAnnotationHighlightObj(uuid: string, href: string, def: IHighlightDefinition): IHighlightHandlerState {
    const highlight: IHighlightHandlerState = {
        uuid,
        type: "annotation",
        href,
        def: JSON.parse(JSON.stringify(def)),
    };
    debug("Create", highlight);
    return highlight;
}

function* createAnnotationHighlightFromAnnotationPush(action: readerLocalActionAnnotations.push.TAction): SagaIterator {
    const {
        uuid,
        def: { locator: { href }, selectionInfo },
        comment,
        color,
    } = action.payload;
    yield* putTyped(readerLocalActionHighlights.handler.push.build(createAnnotationHighlightObj(uuid, href, { selectionInfo, color })));

    // need to do an assert annotation mode must be activated
    assert.equal(yield* selectTyped((store: IReaderRootState) => store.annotation.enable), true);

    // open picker to update name,color,...
    yield* putTyped(readerLocalActionAnnotationUI.picker.build(comment, color, uuid));
    yield* putTyped(readerLocalActionPicker.manager.build(true, "annotation"));
}

function* deleteAnnotationHighlightFromAnnotationPop(action: readerLocalActionAnnotations.pop.TAction): SagaIterator {
    const {
        uuid,
    } = action.payload;

    yield* putTyped(readerLocalActionHighlights.handler.pop.build({ uuid }));
}

function* selectionInfoWatcher(action: readerLocalActionSetLocator.TAction): SagaIterator {
    const def = action.payload;

    // 1. Check if annotation mode is enabled
    if (!(yield* selectTyped((store: IReaderRootState) => store.annotation.enable))) {
        return ;
    }

    const color = yield* selectTyped((store: IReaderRootState) => store.annotation.color);
    const colorDefined = color.red == 0 && color.green == 0 && color.red == 0 ? {red: 255, green: 0, blue: 0} : color;

    // 2. Check if it is a user selection and a new selection
    if (
        def.selectionInfo
        && def.selectionIsNew
    ) {

        const annotation: IAnnotationStateWithoutUUID = {
            // name: selectionInfo.cleanText.slice(0, 20),
            comment: "no comment", // TODO change this
            hash: yield* callTyped(hashing, def.locator.href, {selectionInfo: def.selectionInfo, color: colorDefined}),
            def,
            color: colorDefined,
        };
        yield* putTyped(readerLocalActionAnnotations.push.build(annotation));
    }
}

function* annotationUIEnable(_action: readerLocalActionAnnotationUI.enable.TAction): SagaIterator {

    // move all anotations from reader.annotations to reader.hightlight.handler
    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation.map(([, v]) => v));
    const annotationHightlightArray = annotations.map(({uuid, def: {locator: {href}, selectionInfo}, color}) => createAnnotationHighlightObj(uuid, href, { selectionInfo, color }));
    yield* putTyped(readerLocalActionHighlights.handler.push.build(...annotationHightlightArray));
}

function* annotationUIDisable(_action: readerLocalActionAnnotationUI.enable.TAction): SagaIterator {

    const highlights = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler.map(([, v]) => v));
    const highlightsAnnotation = highlights.filter((v) => v.type === "annotation");

    // FYI: "Uncaught SyntaxError: Too many arguments in function call (only 65535 allowed)"
    yield* putTyped(readerLocalActionHighlights.handler.pop.build(...highlightsAnnotation));
}

function* annotationClick(action: readerLocalActionHighlights.click.TAction): SagaIterator {
    const {href, type, def: defHighlight} = action.payload;
    if (type !== "annotation") {
        return ;
    }

    const hash = yield* callTyped(hashing, href, defHighlight);

    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation.map(([, v]) => v));
    const annotationFound = annotations.find((v) => v.hash === hash);

    if (!annotationFound) {
        debug("annotationNotFound on click", defHighlight);
        return ;
    }

    assert.deepEqual(href, annotationFound.def.locator.href);
    assert.deepEqual(defHighlight, {selectionInfo: annotationFound.def.selectionInfo, color: annotationFound.color});

    yield* putTyped(readerLocalActionAnnotationUI.focus.build(annotationFound.uuid));
}

function* annotationUIFocus(action: readerLocalActionAnnotationUI.focus.TAction): SagaIterator {
    const {newFocusAnnotationUUID: uuid} = action.payload;

    const annotations = yield* selectTyped((store: IReaderRootState) => store.reader.annotation.map(([, v]) => v));
    const annotationFound = annotations.find((v) => v.uuid === uuid);
    if (!annotationFound) {
        debug("annotationNotFound on focus", uuid);
        return ;
    }

    const {comment, color, def} = annotationFound;
    const { locator: { href }, selectionInfo } = def;

    yield* putTyped(readerLocalActionHighlights.handler.push.build(createAnnotationHighlightObj(uuid, href, {selectionInfo, color})));

    // update picker info and doesn't force enable annotation mode, view or edit mode allowed
    yield* putTyped(readerLocalActionAnnotationUI.picker.build(comment, color, uuid));
    yield* putTyped(readerLocalActionPicker.manager.build(true, "annotation"));
}

function* updateAnnotationAndRedrawHightlightIfColorChanged(action: readerLocalActionAnnotations.update.TAction): SagaIterator {
    const {color, uuid} = action.payload;

    const winId = yield* selectTyped((state: IReaderRootState) => state.win.identifier);
    assert.ok(winId);
    const readerAnnotations = yield* selectTyped((state: IReaderRootState) => state.reader.annotation);
    const state = {annotation: readerAnnotations};
    yield* putTyped(readerActions.setReduxState.build(winId, state));

    const highlights = yield* selectTyped((store: IReaderRootState) => store.reader.highlight.handler.map(([, v]) => v));
    const highlightsAnnotation = highlights.find((v) => v.uuid === uuid);
    debug("find hightlight:", highlightsAnnotation);
    if (!highlightsAnnotation) {
        debug("HightlightHandlerAnnotationNotFound on redraw color if updated", uuid);
        return ;
    }

    if (!color) {
        debug("no color provided; no redraw");
        return ;
    }

    if (highlightsAnnotation.def.color.red === color.red && highlightsAnnotation.def.color.blue === color.blue && highlightsAnnotation.def.color.green === color.green) {
        debug("same color no redraw needed!");
        return ;
    }

    debug("redraw with color", color);
    yield* putTyped(readerLocalActionHighlights.handler.pop.build(highlightsAnnotation));

    const newHighlightsAnnotation = JSON.parse(JSON.stringify(highlightsAnnotation)) as IHighlightHandlerState;
    newHighlightsAnnotation.def.color = {red: color.red, blue: color.blue, green: color.green};
    yield* putTyped(readerLocalActionHighlights.handler.push.build(newHighlightsAnnotation));
}

export const saga = () =>
    all([
        takeSpawnEvery(
            readerLocalActionHighlights.click.ID,
            annotationClick,
            (e) => console.error("readerLocalActionAnnotationUI.click", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotationUI.cancel.ID,
            annotationUIDisable,
            (e) => console.error("readerLocalActionAnnotationUI.cancel", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotationUI.enable.ID,
            annotationUIEnable,
            (e) => console.error("readerLocalActionAnnotationUI.enable", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.update.ID,
            updateAnnotationAndRedrawHightlightIfColorChanged,
            (e) => console.error("readerLocalActionAnnotations.update", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotationUI.focus.ID,
            annotationUIFocus,
            (e) => console.error("readerLocalActionAnnotationUI.focus", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.push.ID,
            createAnnotationHighlightFromAnnotationPush,
            (e) => console.error("readerLocalActionAnnotations.push", e),
        ),
        takeSpawnEvery(
            readerLocalActionAnnotations.pop.ID,
            deleteAnnotationHighlightFromAnnotationPop,
            (e) => console.error("readerLocalActionAnnotations.pop", e),
        ),
        takeSpawnEvery(
            readerLocalActionSetLocator.ID,
            selectionInfoWatcher,
            (e) => console.error("readerLocalActionSetLocator", e),
        ),
        takeSpawnEvery(
            readerLocalActionSetLocator.ID,
            () => debug("hello"),
            (e) => console.error("readerLocalActionSetLocator", e),
        ),
    ]);
