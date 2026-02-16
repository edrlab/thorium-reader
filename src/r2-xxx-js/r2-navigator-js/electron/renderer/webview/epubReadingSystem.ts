// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReadiumElectronWebviewWindow } from "./state";

// http://www.idpf.org/epub/31/spec/epub-contentdocs.html#app-epubReadingSystem

export interface INameVersion {
    name: string;
    version: string;
}

interface IEpubReadingSystem extends INameVersion {
    hasFeature: (feature: string, version: string) => boolean;
}

interface IWindowNavigator extends Navigator {
    epubReadingSystem: IEpubReadingSystem;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setWindowNavigatorEpubReadingSystem(win: ReadiumElectronWebviewWindow, obj: any) {

    const ers = {} as IEpubReadingSystem;
    (win.navigator as IWindowNavigator).epubReadingSystem = ers;
    ers.name = obj.name || "Readium2";
    ers.version = obj.version || "0.0.0";

    ers.hasFeature = (feature: string, _version: string) => {
        switch (feature) {
            case "dom-manipulation": {
                return true;
            }
            case "layout-changes": {
                return true;
            }
            case "touch-events": {
                return true;
            }
            case "mouse-events": {
                return true;
            }
            case "keyboard-events": {
                return true;
            }
            case "spine-scripting": {
                return true;
            }
            default: return false;
        }
    };
}
