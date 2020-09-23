// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as assert from "assert";
import * as debug_ from "debug";

const debug = debug_("readium-desktop:utils/eventBus");

type TCallBack<Param = any, Ret = any> = (...a: Param[]) => Ret;

export interface IEventBus {
    subscribe: (key: any, fn: TCallBack) => void;
    dispatch: (key: any, ...a: any[]) => void;
    remove: (fn: TCallBack, key?: any) => void;
    removeKey: (key: any) => void;
}

export interface IEventBusMasterSlave {
    master: IEventBus;
    slave: IEventBus;
}

interface IEventObj {
    [key: string]: Set<TCallBack>;
}

export function eventBus(): IEventBusMasterSlave {

    const eventMaster: IEventObj = {};
    const eventSlave: IEventObj = {};

    const subscribe = (isMaster: boolean) =>
        <TKey extends string, TFn extends TCallBack>(key: TKey, fn: TFn) => {

            const event = isMaster ? eventMaster : eventSlave;

            if (event[key]) {
                const set = event[key];
                set.add(fn);

            } else {
                const set = new Set<TCallBack>();
                set.add(fn);
                event[key] = set;

            }
        };

    const dispatch = (isMaster: boolean) =>
        <TKey extends string, TArg extends any[]>(key: TKey, ...a: TArg) => {

            const event = isMaster ? eventSlave : eventMaster; // dispatch an event to opponent subscribe

            event[key]?.forEach((fn) => {
                try {
                    fn(...a);
                } catch (e) {
                    debug(e);
                }
            });
        };

    const remove = (isMaster: boolean) =>
        <TKey extends string, TFn extends TCallBack>(fn: TFn, key?: TKey) => {

            const event = isMaster ? eventMaster : eventSlave;

            if (fn) {
                if (key) {
                    event[key]?.delete(fn);
                } else {
                    Object.values(event).forEach((set) => set?.delete(fn));
                }
            }
        };

    const removeKey = (isMaster: boolean) =>
        <TKey extends string>(key: TKey) => {

            const event = isMaster ? eventMaster : eventSlave;
            delete event[key];
        };

    return {
        master: {
            subscribe: subscribe(true),
            dispatch: dispatch(true),
            remove: remove(true),
            removeKey: removeKey(true),
        },
        slave: {
            subscribe: subscribe(false),
            dispatch: dispatch(false),
            remove: remove(false),
            removeKey: removeKey(false),
        },
    };
}

// TEST
if (require.main === module) {

    const bus = eventBus();

    let bool: boolean;

    bus.master.subscribe("test", (value: boolean) => bool = value);
    bus.slave.dispatch("test", true);

    debug(bool);

    assert.ok(bool); // should be true
}
