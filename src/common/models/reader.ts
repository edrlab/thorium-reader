// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { PublicationView } from "readium-desktop/common/views/publication";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { TDrawType, TDrawView } from "../redux/states/renderer/annotation";

import { IColor } from "@r2-navigator-js/electron/common/highlight";

export enum ReaderMode {
    Attached = "attached",
    Detached = "detached",
}

export interface ReaderTTSMediaOverlay {
    ttsPlaybackRate: string;

    // no need to be persisted in defaultConfig
    // cf ReaderSettings.tsx -> SaveResetApplyPreset function
    // cf configSetDefault.ts action READER_DEFAULT_CONFIG_SET_REQUEST
    ttsVoices: SpeechSynthesisVoice[],

    mediaOverlaysPlaybackRate: string,
}

export interface ReaderInfoNavigator {
    r2PublicationHasMediaOverlays: boolean;
}

/**
 *  A reader
 */
export interface ReaderInfo {
    filesystemPath: string;
    manifestUrlHttp: string;
    manifestUrlR2Protocol: string;
    publicationIdentifier: string;
    r2Publication: R2Publication;
    publicationView: PublicationView;
    navigator: ReaderInfoNavigator;
}

/**
 * A reader configuration
 */

export interface ReaderConfigPublisher extends Pick<ReaderConfigStrings, "font" | "fontSize" | "pageMargins" | "wordSpacing" | "letterSpacing" | "paraSpacing" | "lineHeight"> {
}

export interface ReaderConfigStringsAdjustables {
    fontSize: string;
    pageMargins: string;
    wordSpacing: string;
    letterSpacing: string;
    paraSpacing: string;
    lineHeight: string;
}

export type TTheme = "neutral" | "sepia" | "night" | "contrast1" | "contrast2" | "contrast3"   | "contrast4" | "paper";

export interface ReaderConfigStrings extends ReaderConfigStringsAdjustables {
    // using string instead of enum here, because values provided dynamically in code (mapped types)
    // textAlignEnum.justify | textAlignEnum.left | textAlignEnum.right | textAlignEnum.start
    align: string; // textAlignEnum | "auto";
    theme: TTheme;
    colCount: string;
    font: string;
}

export interface ReaderConfigBooleans {

    // not used ?
    dark: boolean;

    sepia: boolean;
    night: boolean;

    invert: boolean;
    paged: boolean;
    readiumcss: boolean;
    enableMathJax: boolean;
    reduceMotion: boolean;
    noFootnotes: boolean;
    noTemporaryNavTargetOutline: boolean;
    noRuby: boolean;
    darken: boolean;
    ttsAndMediaOverlaysDisableContinuousPlay: boolean;
    mediaOverlaysEnableSkippability: boolean;
    mediaOverlaysIgnoreAndUseTTS: boolean;
    ttsEnableSentenceDetection: boolean;
    mediaOverlaysEnableCaptionsMode: boolean;
    ttsEnableOverlayMode: boolean;
}

export interface IReaderConfigSettingsMenuState {
    readerDockingMode: "full" | "left" | "right";

    // not persisted in defaultConfig, see SaveResetApplyPreset in ReaderSettings.tsx
    // removed from defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    // skipped in src/renderer/common/hooks/useReaderConfig.ts
    readerSettingsSection: string; // TODO enum ?// default : isDivina ? "tab-divina" : isPdf ? "tab-pdfzoom" : "tab-display",

    // not persisted in defaultConfig, see SaveResetApplyPreset in ReaderSettings.tsx
    // removed from defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    // skipped in src/renderer/common/hooks/useReaderConfig.ts
    readerMenuSection: string; // TODO enum ? // default : tab-toc
}

export interface IAnnotationReaderConfigState {
    annotation_popoverNotOpenOnNoteTaking: boolean;

    // removed from defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    annotation_defaultColor: IColor;

    annotation_defaultDrawType: TDrawType;
    annotation_defaultDrawView: TDrawView;
}

export interface ReaderConfig extends ReaderConfigStrings, ReaderConfigBooleans, IAnnotationReaderConfigState, IReaderConfigSettingsMenuState, ReaderTTSMediaOverlay {
    ttsHighlightStyle: number;
    ttsHighlightStyle_WORD: number;

    // see defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    ttsHighlightColor: IColor;

    // see defaultCopy in src/common/redux/actions/reader/configSetDefault.ts
    ttsHighlightColor_WORD: IColor;
}

// export interface BookmarkCollection {
//     [key: string]: Bookmark;
// }

// export interface Bookmark extends Identifiable {
//     docHref: string;
//     docSelector: string;
//     publicationIdentifier: string;
// }


// Dialog/Dock Reader menu or settings state
export interface IReaderDialogOrDockSettingsMenuState {
    id: string,
    edit: boolean,
}
