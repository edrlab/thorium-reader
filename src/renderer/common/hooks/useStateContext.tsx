// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

// parent
export function StateContextFactory<T>(defaultDefaultState?: T): [React.Context<{state: T, setState: React.Dispatch<T>}>, (defaultState?: T) => [T, React.Dispatch<T>, React.FC<React.PropsWithChildren<{}>>]] {
    const MyContext = React.createContext<{state: T, setState: React.Dispatch<T>}>(null);

    // hooks useStateContext
    return [
        MyContext,
        (defaultState?: T) => {
            const a = React.useCallback((): [T, React.Dispatch<T>, React.FC<React.PropsWithChildren<{}>>] => {
                const [state, setState] = React.useState(defaultDefaultState || defaultState);
                return [
                    state,
                    setState,
                    (props) =>
                <MyContext.Provider value={{state, setState}}>
                    {props.children}
                </MyContext.Provider>,
                ];
                }, []);
            return a();
        },
    ];
}

// children
export function useStateContextChildren<T>(context: React.Context<{
    state: T;
    setState: React.Dispatch<T>;
}>): [T, React.Dispatch<T>] {

    const {state, setState} = React.useContext(context);
    return [state, setState];
}