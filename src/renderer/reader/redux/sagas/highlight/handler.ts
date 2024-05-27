// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// import {
//     highlightsDrawMargin, highlightsRemove,
// } from "@r2-navigator-js/electron/renderer";
import {
    takeSpawnEvery, takeSpawnEveryChannel,
} from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put } from "redux-saga/effects";
import { select as selectTyped } from "typed-redux-saga/macro";
import { readerLocalActionHighlights, readerLocalActionLocatorHrefChanged } from "../../actions";
import {
    THighlightClick,
    getHightlightClickChannel,
    mountHighlight, unmountHightlight,
} from "./mounter";
// import { handleLinkLocator } from "@r2-navigator-js/electron/renderer";
// import debounce from "debounce";
// import { IS_DEV } from "readium-desktop/preprocessor-directives";

const debug = debug_("readium-desktop:renderer:reader:redux:sagas:highlight:handler");

// const handleLinkLocatorDebounced = debounce(handleLinkLocator, 200);

function* push(action: readerLocalActionHighlights.handler.push.TAction) {
    if (action.payload) {

        debug(`push (mountHighlight) -- action.payload: [${JSON.stringify(action.payload.map(({uuid}) => uuid), null, 4)}]`);

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        debug(`push (mountHighlight) -- href: [${href}]`);
        if (href) {
            yield call(mountHighlight, href, action.payload);
        }

        const href2 = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.secondWebViewHref);
        debug(`push (mountHighlight) -- href2: [${href2}]`);
        if (href2) {
            yield call(mountHighlight, href2, action.payload);
        }
    }
}

function* pop(action: readerLocalActionHighlights.handler.pop.TAction) {
    if (action.payload) {

        debug(`pop (unmountHightlight) -- action.payload: [${JSON.stringify(action.payload.map(({uuid}) => uuid), null, 4)}]`);

        const href = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.locator?.href);
        const href2 = yield* selectTyped((store: IReaderRootState) => store.reader?.locator?.secondWebViewHref);

        debug(`pop (unmountHightlight) -- href: [${href}] href2: [${href2}]`);

        const actionUuids = action.payload.map(({uuid}) => uuid);

        if (href) {
            yield call(unmountHightlight, href, actionUuids);
        }

        if (href2) {
            yield call(unmountHightlight, href2, actionUuids);
        }
    }
}

function* hrefChanged(action: readerLocalActionLocatorHrefChanged.TAction) {

    // divina,
    const { info, locator } = yield* selectTyped((state: IReaderRootState) => state.reader);
    // typeof divina !== "undefined" ||
    const skip = info?.publicationView?.isDivina ||
        locator?.audioPlaybackInfo || info?.publicationView?.isAudio ||
        info?.publicationView?.isPDF;
    if (skip) {
        // divina,
        debug("hrefChanged SKIP annot", skip, info?.publicationView?.isDivina, locator?.audioPlaybackInfo, info?.publicationView?.isAudio, info?.publicationView?.isPDF);
        return;
    }

    debug(`hrefChanged (unmountHightlight+mountHighlight) -- action.payload: [${JSON.stringify(action.payload, null, 4)}]`);

    // yield* callTyped(() => highlightsDrawMargin(_drawMargin)); // should probably be invoked in mounter, not handler

    const { payload: { href, prevHref, href2, prevHref2 } } = action;

    const mounterStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    // if (!mounterStateMap?.length) {
    //     debug(`hrefChanged (unmountHightlight+mountHighlight) MOUNTER STATE EMPTY -- mounterStateMap: [${JSON.stringify(mounterStateMap, null, 4)}]`);
    //     return;
    // }

    const uuids = mounterStateMap.map(([uuid, _mounterState]) => uuid);

    if (prevHref) {
        yield call(unmountHightlight, prevHref, uuids);
    }
    if (prevHref2) {
        yield call(unmountHightlight, prevHref2, uuids);
    }

    if (href && (!prevHref || href !== prevHref)) {
        yield call(unmountHightlight, href, uuids);
    }
    if (href2 && (!prevHref2 || href2 !== prevHref2)) {
        yield call(unmountHightlight, href2, uuids);
    }

    const handlerStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    if (!handlerStateMap?.length) {
        debug(`hrefChanged (mountHightlight) HANDLER STATE EMPTY -- handlerStateMap: [${JSON.stringify(handlerStateMap, null, 4)}]`);
        return;
    }

    const handlerStateMap_ = handlerStateMap.map(([_uuid, handlerState]) => handlerState);

    debug(`hrefChanged (mountHighlight) -- handlerStateMap: [${handlerStateMap_ ? handlerStateMap_.length : JSON.stringify(handlerStateMap_, null, 4)}]`);

    if (href) {
        yield call(mountHighlight, href, handlerStateMap_);
    }
    if (href2) {
        yield call(mountHighlight, href2, handlerStateMap_);
    }
}

// // TODO HIGHLIGHTS-MARGIN: really naive implementation, doesn't survive in application state (good enough for early testing)
// // let _drawMargin: boolean | string[] = false;
// // const GROUPS = ["search", "annotations"];

function* dispatchClick(data: THighlightClick) {

    debug(`dispatchClick -- data: [${JSON.stringify(data, null, 4)}]`);

    const [href, ref] = data;

    // // TODO HIGHLIGHTS-MARGIN: the ALT+CLICK UX is only just for experimenting (hidden undocumented feature)
    // if (event.alt) {

    //     if (_drawMargin === false) {
    //         _drawMargin = [ref.group];
    //     } else if (_drawMargin === true) {
    //         _drawMargin = GROUPS.filter((g) => g !== ref.group);
    //     } else if (Array.isArray(_drawMargin)) {
    //         if (_drawMargin.includes(ref.group)) {
    //             _drawMargin = _drawMargin.filter((g) => g !== ref.group);
    //         } else {
    //             _drawMargin.push(ref.group);
    //         }
    //     } else {
    //         _drawMargin = false;
    //     }
    //     yield* callTyped(() => highlightsDrawMargin(_drawMargin)); // should probably be invoked in mounter, not handler
    //     return;
    // }

    // // TODO HIGHLIGHTS-ANNOTATIONS: this is just a hack for testing!
    // if (IS_DEV) {
    //       if (ref.group === "annotations") {
    //           if (event.meta) {
    //               yield* callTyped(() => highlightsRemove(href, [ref.id]));
    //               return;
    //           }
    //           if (href && ref?.selectionInfo?.rangeInfo) {
    //               handleLinkLocatorDebounced({
    //                   href,
    //                   locations: {
    //                       cssSelector: ref.selectionInfo.rangeInfo.startContainerElementCssSelector,
    //                       rangeInfo: ref.selectionInfo.rangeInfo,
    //                   },
    //               });
    //           }
    //       }
    //   }

    // Not used in annotation
    // if (ref.group === "annotation") {
    //     return ;

    //     // NOT USED FOR ANNOTATION JUST SEARCH!
    // }
    //

    const mounterStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.mounter);
    if (!mounterStateMap?.length) {
        debug(`dispatchClick MOUNTER STATE EMPTY -- mounterStateMap: [${JSON.stringify(mounterStateMap, null, 4)}]`);
        return;
    }

    const mounterStateItem = mounterStateMap.find(([_uuid, mounterState]) => mounterState.ref.id === ref.id && mounterState.href === href);

    if (!mounterStateItem) {
        debug(`dispatchClick CANNOT FIND MOUNTER -- href: [${href}] ref.id: [${ref.id}] mounterStateMap: [${JSON.stringify(mounterStateMap, null, 4)}]`);
        return;
    }

    const [mounterStateItemUuid] = mounterStateItem; // mounterStateItem[0]

    const handlerStateMap = yield* selectTyped((state: IReaderRootState) => state.reader.highlight.handler);
    if (!handlerStateMap?.length) {
        debug(`dispatchClick HANDLER STATE EMPTY -- handlerStateMap: [${JSON.stringify(handlerStateMap, null, 4)}]`);
        return;
    }

    const handlerStateItem = handlerStateMap.find(([uuid, _handlerState]) => uuid === mounterStateItemUuid);

    if (!handlerStateItem) {
        debug(`dispatchClick CANNOT FIND HANDLER -- uuid: [${mounterStateItemUuid}] handlerStateMap: [${JSON.stringify(handlerStateMap, null, 4)}]`);
        return;
    }

    const [uuid, handlerState] = handlerStateItem;

    debug(`dispatchClick CLICK ACTION ... -- uuid: [${uuid}] handlerState: [${JSON.stringify(handlerState, null, 4)}]`);

    // used for search not annotation
    yield put(readerLocalActionHighlights.click.build(handlerState));
}

export const saga = () => {

    const clickChannel = getHightlightClickChannel();
    return all([
        takeSpawnEvery(
            readerLocalActionHighlights.handler.pop.ID,
            pop,
        ),
        takeSpawnEvery(
            readerLocalActionHighlights.handler.push.ID,
            push,
        ),
        takeSpawnEvery(
            readerLocalActionLocatorHrefChanged.ID,
            hrefChanged,
        ),
        takeSpawnEveryChannel(
            clickChannel,
            dispatchClick,
        ),
    ]);
};
