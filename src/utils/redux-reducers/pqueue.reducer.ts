// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";
import { Action } from "redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ActionWithPayload<Type = string>
    extends Action<Type> {
}

export interface IPQueueAction<TAction extends
    ActionWithPayload<ActionType>, Key = number, Value = string, ActionType = string> {
    type: ActionType;
    selector: (action: TAction, queue: Readonly<TPQueueState<Key, Value>>) => IPQueueState<Key, Value>;
}

export interface IPQueueData
<
    TPushAction extends ActionWithPayload<ActionType>,
    TPopAction extends ActionWithPayload<ActionType>,
    Key = number,
    Value = string,
    ActionType = string,
    TUpdateAction extends ActionWithPayload<ActionType> = undefined,
> {
    push: IPQueueAction<TPushAction, Key, Value, ActionType>;
    pop: IPQueueAction<TPopAction, Key, Value, ActionType>;
    update?: IPQueueAction<TUpdateAction, Key, Value, ActionType>
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
        ActionType = string,
        TUpdateAction extends ActionWithPayload<ActionType> = undefined,
    >(
        data: IPQueueData<TPushAction, TPopAction, Key, Value, ActionType, TUpdateAction>,
) {

    const reducer =
        (
                queue: TPQueueState<Key, Value>,
                action: TPopAction | TPushAction | TUpdateAction,
        ): TPQueueState<Key, Value> => {

            if (!queue || !Array.isArray(queue)) {
                queue = [];
            }

            if (action.type === data.push.type) {
                const newQueue = queue.slice();

                const selectorItem = data.push.selector(action as TPushAction, queue);
                if (selectorItem[1]) {

                    // find same value
                    const index = newQueue.findIndex((item) => item[1] === selectorItem[1]);
                    if (index > -1) {
                        newQueue[index] = selectorItem;
                    } else {
                        newQueue.push(selectorItem);
                    }

                    // WARNING: .sort() is in-place same-array mutation! (not a new array)
                    // ... which is fine here because .slice() to create a shallow copy
                    newQueue.sort(data.sortFct);

                    return newQueue;
                }

            } else if (action.type === data.pop.type) {

                const selectorItem = data.pop.selector(action as TPopAction, queue);
                const index = queue.findIndex((item) => item[1] === selectorItem[1]);
                if (index > -1) {

                    const newQueue = queue.slice();

                    const left = newQueue.slice(0, index);
                    const right = newQueue.slice(index + 1, newQueue.length);

                    return left.concat(right);
                }

            } else if (action.type === data.update?.type) {

                const [k,v] = data.update.selector(action as TUpdateAction, queue);
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
