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

export const locatorHrefWatcherMiddleware: Middleware
    = (store: MiddlewareAPI<Dispatch<UnknownAction>, IReaderRootState>) =>
        (next: (action: unknown) => unknown) => // Dispatch<ActionWithSender>
            (action: unknown) => { // ActionWithSender

                const prevState = store.getState();

                const returnValue = next(action);

                const nextState = store.getState();

                const prevHref = prevState?.reader?.locator?.locator?.href;
                const prevHref2 = prevState?.reader?.locator?.secondWebViewHref;

                const nextHref = nextState?.reader?.locator?.locator?.href;
                const nextHref2 = nextState?.reader?.locator?.secondWebViewHref;

                debug(`locatorHrefWatcherMiddleware -- prevHref: [${prevHref}] prevHref2: [${prevHref2}] nextHref: [${nextHref}] nextHref2: [${nextHref2}]`);

                if (nextHref && prevHref !== nextHref) {
                    store.dispatch(readerLocalActionLocatorHrefChanged.build(prevHref, nextHref, prevHref2, nextHref2));
                }

                return returnValue;
            };
