// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ActionWithSender } from "readium-desktop/common/models/sync";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";

import { readerLocalActionLocatorHrefChanged } from "../actions";

const dispatchHref = (store: MiddlewareAPI<Dispatch<AnyAction>, IReaderRootState>) => {

    const state = store.getState();
    const href = state.reader?.locator?.locator?.href;
    if (href) {
        store.dispatch(readerLocalActionLocatorHrefChanged.build(href));
    }
};

export const locatorHrefWatcherMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<AnyAction>, IReaderRootState>) =>
        (next: Dispatch<ActionWithSender>) =>
            (action: ActionWithSender) => {

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                if (prevState?.reader?.locator?.locator?.href !== nextState?.reader?.locator?.locator?.href) {
                    dispatchHref(store);
                }

                return returnValue;
            };
