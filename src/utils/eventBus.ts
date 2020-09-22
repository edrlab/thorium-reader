// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

type TCallBack = (...a: any[]) => any;

export function eventBus() {

    const eventObj: {
        [key: string]: Set<TCallBack>;
    } = {};

    const on = (key: string, fn: TCallBack) => {

        if (eventObj[key]) {
            const set = eventObj[key];
            set.add(fn);

        } else {
            const set = new Set<TCallBack>();
            set.add(fn);
            eventObj[key] = set;

        }
    };

    const dispatch = (key: string, ...a: any[]) => {

        if (eventObj[key]) {

            const set = eventObj[key];
            set.forEach((fn) => {
                try {
                    fn(...a);
                } catch (e) {
                    // ignore
                }
            });
        }
    };

    const remove = (fn: TCallBack, key?: string) => {

        if (fn) {
            if (key) {
                const set = eventObj[key];
                if (set) {
                    set.delete(fn);
                }

            } else {
                Object.values(eventObj).forEach((set) => {
                    if (set) {
                        set.delete(fn);
                    }
                });
            }
        }
    };

    const removeAll = (key: string) => {

        eventObj[key] = new Set<TCallBack>();
    };

    return {
        on,
        dispatch,
        remove,
        removeAll,
    };
}
