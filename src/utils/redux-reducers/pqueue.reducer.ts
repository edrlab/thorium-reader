// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { Action, type UnknownAction } from "redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ActionWithPayload<Type extends string = string>
    extends Action<Type> {
}

export interface IPQueueAction<TAction extends
    ActionWithPayload<string>, Key = number, Value = string> {

    type: string | string[];
    selector: (action: TAction, queue: Readonly<TPQueueState<Key, Value>>) => IPQueueState<Key, Value>;
}

export interface IPQueueData
<
    TPushAction extends ActionWithPayload,
    TPopAction extends ActionWithPayload,
    Key = number,
    Value = string,
    TUpdateAction extends ActionWithPayload = undefined,
> {
    push: IPQueueAction<TPushAction, Key, Value>;
    pop: IPQueueAction<TPopAction, Key, Value>;
    update?: IPQueueAction<TUpdateAction, Key, Value>
    sortFct?: (a: IPQueueState<Key, Value>, b: IPQueueState<Key, Value>) => number;
}

export type IPQueueState<Key, Value> = [Key, Value];
export type TPQueueState<K = number, V = string> = Array<IPQueueState<K, V>>;

export function priorityQueueReducer
    <
        TPushAction extends ActionWithPayload<ActionType>,
        TPopAction extends ActionWithPayload<ActionType>,
        Key = number,
        Value = string,
        ActionType extends string = string,
        TUpdateAction extends ActionWithPayload<ActionType> = undefined,
    >(
        data: IPQueueData<TPushAction, TPopAction, Key, Value, TUpdateAction>,
) {

    const reducer =
        (
                queue: TPQueueState<Key, Value>,
                action: UnknownAction, // TPopAction | TPushAction | TUpdateAction,
        ): TPQueueState<Key, Value> => {

            if (!queue || !Array.isArray(queue)) {
                queue = [];
            }

            if ((Array.isArray(data.push.type) && data.push.type.includes(action.type)) || action.type === data.push.type) {
                const newQueue = queue.slice();

                // console.log("$$$$");
                // console.log("PUSH !!");
                // console.log("$$$$");

                const selectorItem = data.push.selector(action as unknown as TPushAction, queue);
                if (selectorItem[1]) {


                    // console.log("$$$$");
                    // console.log(`PUSH !! ${selectorItem[1]}`);

                    // find same value
                    const index = newQueue.findIndex((item) => item[1] === selectorItem[1]);
                    if (index > -1) {

                        // console.log(`PUSH with index ${index} ${selectorItem[1]}`);
                        newQueue[index] = selectorItem;
                    } else {
                        newQueue.push([selectorItem[0], clone(selectorItem[1])]);
                    }
                    
                    // console.log("$$$$");

                    // WARNING: .sort() is in-place same-array mutation! (not a new array)
                    // ... which is fine here because .slice() to create a shallow copy
                    newQueue.sort(data.sortFct);

                    return newQueue;
                }

            } else if ((Array.isArray(data.pop.type) && data.pop.type.includes(action.type)) || action.type === data.pop.type) {

                // console.log("$$$$");
                // console.log("POP !!");
                // console.log("$$$$");
                

                const selectorItem = data.pop.selector(action as unknown as TPopAction, queue);
                const index = queue.findIndex((item) => item[1] === selectorItem[1]);
                if (index > -1) {
                    // console.log("$$$$");
                    // console.log(`POP ${index} !! ${selectorItem[1]}`);
                    // console.log("$$$$");

                    const newQueue = queue.slice();

                    const left = newQueue.slice(0, index);
                    const right = newQueue.slice(index + 1, newQueue.length);

                    return left.concat(right);
                }

            } else if ((Array.isArray(data.update?.type) && data.update.type.includes(action.type)) || action.type === data.update?.type) {

                const [k,v] = data.update.selector(action as unknown as TUpdateAction, queue);
                const index = queue.findIndex(([_k]) => _k === k);

                if (index > -1) {

                    const newQueue = queue.slice();

                    newQueue[index] = [clone(k), clone(v)];
                    return newQueue;
                }

            }

            return queue;
        };

    return reducer;
}
