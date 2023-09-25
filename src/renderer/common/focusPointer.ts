import { RefObject } from "react";

let focusPtrRef: RefObject<any> | undefined = undefined;

export const setFocusRef = (ref: RefObject<any>) => {
    if (ref) {
        focusPtrRef = ref;
    }
};

export const getFocusRef = () => focusPtrRef;

export const clearFocusRef = (ref: RefObject<any>) => {
    if (ref?.current === focusPtrRef?.current) {
        focusPtrRef = undefined;
    }
};
