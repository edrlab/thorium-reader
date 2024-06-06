// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReaderConfig, ReaderConfigStringsAdjustables } from "readium-desktop/common/models/reader";
import {
    TKeyboardEventOnAnchor, TMouseEventOnAnchor,
    TMouseEventOnSpan,
} from "readium-desktop/typings/react";

import { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { TToc } from "../pdf/common/pdfReader.type";
import { TdivinaReadingMode } from "readium-desktop/common/redux/states/renderer/divina";

export const fontSize: string[] = [
    "75%",
    "87.5%",
    "100%", // default
    "112.5%",
    "137.5%",
    "150%",
    "162.5%",
    "175%",
    "200%",
    "225%",
    "250%",
];

export const pageMargins: string[] = [
    "0",
    "0.5", // default
    "0.75",
    "1",
    "1.25",
    "1.5",
    "1.75",
    "2",
];

export const wordSpacing: string[] = [
    "0", // default
    "0.0675rem",
    "0.125rem",
    "0.1875rem",
    "0.25rem",
    "0.3125rem",
    "0.375rem",
    "0.4375rem",
    "0.5rem",
    "1rem",
];

export const letterSpacing: string[] = [
    "0", // default
    "0.0675rem",
    "0.125rem",
    "0.1875rem",
    "0.25rem",
    "0.3125rem",
    "0.375rem",
    "0.4375rem",
    "0.5rem",
];

export const paraSpacing: string[] = [
    "0", // default
    "0.5rem",
    "1rem",
    "1.25rem",
    "1.5rem",
    "2rem",
    "2.5rem",
    "3rem",
];

export const lineHeight: string[] = [
    "0", // noop
    "1",
    "1.125",
    "1.25",
    "1.35",
    "1.5", // default
    "1.65",
    "1.75",
    "2",
];

const optionsValues = {
    fontSize,
    pageMargins,
    wordSpacing,
    letterSpacing,
    paraSpacing,
    lineHeight,
} as AdjustableSettingsStrings;

export type AdjustableSettingsStrings = {
    [key in keyof ReaderConfigStringsAdjustables]: string[];
};

export type AdjustableSettingsNumber = {
    [key in keyof ReaderConfigStringsAdjustables]: number;
};

export default optionsValues;

export interface IReaderMenuProps {
    open: boolean;
    doFocus: number;
    r2Publication: R2Publication;
    // tslint:disable-next-line: max-line-length
    handleLinkClick: (event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string, closeNavPanel?: boolean) => void;
    goToLocator: (locator: R2Locator, closeNavPanel?: boolean) => void;
    toggleMenu: () => void;
    focusMainAreaLandmarkAndCloseMenu: () => void;
    pdfToc: TToc;
    isPdf: boolean;
    pdfNumberOfPages: number;

    openedSection: string;
    annotationUUID: string;
    resetAnnotationUUID: () => void;
    setOpenedSection: (v: string) => void;
}

export const isDivinaReadingMode = (v: any): v is TdivinaReadingMode => {
    return ["single", "double", "scroll", "guided"].includes(v);
};

export interface IReaderSettingsProps {
    indexes: AdjustableSettingsNumber;
    open: boolean;
    doFocus: number;
    readerConfig: ReaderConfig;
    // handleSettingChange: (
    //     event: TChangeEventOnInput | TChangeEventOnSelect | undefined,
    //     name: keyof ReaderConfig,
    //     value?: string | boolean) => void;
    // handleIndexChange: (
    //     event: TChangeEventOnInput,
    //     name: keyof ReaderConfigStringsAdjustables) => void;
    toggleMenu: () => void;
    r2Publication: R2Publication | undefined;
    handleDivinaReadingMode: (v: TdivinaReadingMode) => void;

    divinaReadingMode: TdivinaReadingMode;
    divinaReadingModeSupported: TdivinaReadingMode[];
    isDivina: boolean;
    isPdf: boolean;
    isFXL: boolean;

    // openedSection: number | undefined;
    disableRTLFlip: boolean;
    setDisableRTLFlip: (disabled: boolean) => void;
    zenMode: boolean;
    setZenMode: (value : boolean) => void;
    searchEnable: boolean;
}

export interface IPopoverDialogProps {
    dockingMode: "full" | "left" | "right";
    dockedMode: boolean;
    setDockingMode: (m: "full" | "left" | "right") => void;
}
