// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// import { ActionWithSender } from "readium-desktop/common/models/sync";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { UnknownAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

import { readerLocalActionLocatorHrefChanged } from "../actions";

const debug = debug_("readium-desktop:renderer:reader:redux:middleware:locatorHrefWatcher");

const dispatchHref = (
    store: MiddlewareAPI<Dispatch<UnknownAction>, IReaderRootState>,
    prevHref: string | undefined,
    nextHref: string | undefined,
    ) => {

    const state = store.getState();
    const href = state.reader?.locator?.locator?.href;
    if (href) {
        if (href !== nextHref) {
            debug("readerLocalActionLocatorHrefChanged state DIFF? ", href, nextHref, prevHref);
        }
        store.dispatch(readerLocalActionLocatorHrefChanged.build(prevHref, href));
    }
};

export const locatorHrefWatcherMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<UnknownAction>, IReaderRootState>) =>
        (next: (action: unknown) => unknown) => // Dispatch<ActionWithSender>
            (action: unknown) => { // ActionWithSender

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                if (prevState?.reader?.locator?.locator?.href !== nextState?.reader?.locator?.locator?.href) {
                    dispatchHref(store, prevState?.reader?.locator?.locator?.href, nextState?.reader?.locator?.locator?.href);
                }

                return returnValue;
            };
