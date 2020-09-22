// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";

const debug = debug_("readium-desktop:utils/eventBus");

type TCallBack = (...a: any[]) => any;
export interface IBusEvent {
    subscribe: <TKey extends string, TFn extends TCallBack>(key: TKey, fn: TFn) => void;
    dispatch: <TKey extends string, TArg extends any[]>(key: TKey, ...a: TArg) => void;
    remove: <TKey extends string, TFn extends TCallBack>(fn: TFn, key?: TKey) => void;
    removeKey: <TKey extends string>(key: TKey) => void;
}

export function eventBus(): IBusEvent {

    const eventObj: {
        [key: string]: Set<TCallBack>;
    } = {};

    const subscribe = <TKey extends string, TFn extends TCallBack>(key: TKey, fn: TFn) => {

        if (eventObj[key]) {
            const set = eventObj[key];
            set.add(fn);

        } else {
            const set = new Set<TCallBack>();
            set.add(fn);
            eventObj[key] = set;

        }
    };

    const dispatch = <TKey extends string, TArg extends any[]>(key: TKey, ...a: TArg) => {

        eventObj[key]?.forEach((fn) => {
            try {
                fn(...a);
            } catch (e) {
                debug(e);
            }
        });
    };

    const remove = <TKey extends string, TFn extends TCallBack>(fn: TFn, key?: TKey) => {

        if (fn) {
            if (key) {
                eventObj[key]?.delete(fn);
            } else {
                Object.values(eventObj).forEach((set) => set?.delete(fn));
            }
        }
    };

    const removeKey = <TKey extends string>(key: TKey) => {

        delete eventObj[key];
    };

    return {
        subscribe,
        dispatch,
        remove,
        removeKey,
    };
}
