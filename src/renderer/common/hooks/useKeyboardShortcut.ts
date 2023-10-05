// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { TKeyboardShortcutReadOnly, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener } from "../keyboard";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { ReactReduxContext, ReactReduxContextValue } from "react-redux";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { useSyncExternalStoreWithSelector } from "./useSyncExternalStore";

export function useKeyboardShortcut(ListenForKeyUP: boolean, keyboardShortcut: (s: ICommonRootState["keyboard"]["shortcuts"]) => TKeyboardShortcutReadOnly, callback: () => void) {

    React.useEffect(() => {
        ensureKeyboardListenerIsInstalled();
    }, []);
    const { store } = React.useContext<ReactReduxContextValue<ILibraryRootState>>(ReactReduxContext);
    const keyboardShortcutState = useSyncExternalStoreWithSelector(
        store.subscribe,
        () => store.getState(),
        undefined, // server snapshot
        (state) => state.keyboard.shortcuts,
        keyboardShortcutsMatch,
    );
    React.useEffect(() => {
        registerKeyboardListener(ListenForKeyUP, keyboardShortcut(keyboardShortcutState), callback);
        return () => unregisterKeyboardListener(callback);
    }, [keyboardShortcutState]);

    return ;
}
