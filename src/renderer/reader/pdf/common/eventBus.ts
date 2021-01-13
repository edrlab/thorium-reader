// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";

const debug = debug_("readium-desktop:utils/eventBus");

type TCallBack<Param = any, Ret = any> = (...b: Param[]) => Ret;

export interface IEventBus {
    subscribe: (key: any, fn: TCallBack) => void;
    dispatch: (key: any, ...a: any[]) => void;
    remove: (fn: TCallBack, key?: any) => void;
    removeKey: (key: any) => void;
}

interface IEventObj {
    [key: string]: Set<TCallBack>;
}

export function eventBus(
    tx: (key: any, ...a: any[]) => any,
    rx: (ev: (key: any, ...a: any) => any) => any,
): IEventBus {

    const event: IEventObj = {};

    rx((key, ...arg) => {

        if (event[key]) {
            const fns = event[key];
            fns.forEach((fn) => {
                try {
                    fn(...arg);
                } catch (e) {
                    debug(e);
                }
            });
        }
    });

    const subscribe = <TKey extends string, TFn extends TCallBack>(key: TKey, fn: TFn) => {
        event[key] = (event[key] || new Set<TCallBack>()).add(fn);
    };

    const dispatch = tx;

    const remove = <TKey extends string, TFn extends TCallBack>(fn: TFn, key?: TKey) => {

        if (fn) {
            if (key) {
                event[key]?.delete(fn);
            } else {
                Object.values(event).forEach((set) => set?.delete(fn));
            }
        }
    };

    const removeKey = <TKey extends string>(key: TKey) => {

        delete event[key];
    };

    return {
        subscribe,
        dispatch,
        remove,
        removeKey,
    };
}

// TEST
if (require.main === module) {

    // ignore
}
