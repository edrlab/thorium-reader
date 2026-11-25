// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { UnknownAction, Dispatch, MiddlewareAPI, Unsubscribe } from "redux";

import debug_ from "debug";


// Logger
const debug = debug_("readium-desktop:common:redux:middleware:actionSubscriber");

const __subscribe = new Map<string, Set<(action: UnknownAction) => void>>();

export const subscribeToAction = (actionId: string, callback: (action: UnknownAction) => void): Unsubscribe => {

    const subscribers = __subscribe.get(actionId) || new Set();
    subscribers.add(callback);
    __subscribe.set(actionId, subscribers);

    return () => {
        debug("un-subscribe to the action ID=", actionId);
        subscribers.delete(callback);
        if (!subscribers.size && __subscribe.get(actionId) === subscribers) __subscribe.delete(actionId);
    };
};

export const actionSubscriberMiddleware = (_store: MiddlewareAPI<Dispatch<UnknownAction>, IRendererCommonRootState>) =>
        (next: (action: unknown) => unknown) => // Dispatch<ActionWithSender>
            ((action: unknown) => { // ActionWithSender


        // debug("ACTION=", JSON.stringify(action, null, 4));

        const _action = action as unknown as UnknownAction;

        if (typeof _action?.type === "string" && __subscribe.has(_action.type)) {
            debug("subscriber triggered on ", _action.type);
            for (const subscriber of Array.from(__subscribe.get(_action.type))) subscriber(_action);
        }

        return next(action);
    });
