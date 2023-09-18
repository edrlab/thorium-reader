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
