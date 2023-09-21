// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { TKeyboardShortcutReadOnly } from "readium-desktop/common/keyboard";
import { registerKeyboardListener, unregisterKeyboardListener } from "../keyboard";
import { useSelector } from "./useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

export function useKeyboardShortcut(ListenForKeyUP: boolean, keyboardShortcut: (s: ICommonRootState["keyboard"]["shortcuts"]) => TKeyboardShortcutReadOnly, callback: () => void) {

    const keyboardShortcutState = useSelector((state: ICommonRootState) => state.keyboard.shortcuts);
    React.useEffect(() => {
        registerKeyboardListener(ListenForKeyUP, keyboardShortcut(keyboardShortcutState), callback);
        return () => unregisterKeyboardListener(callback);
    }, [keyboardShortcutState]);

    return ;
}
