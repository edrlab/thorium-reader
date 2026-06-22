// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

import type { IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, IEventPayload_R2_EVENT_WEBVIEW_KEYUP } from "@r2-navigator-js/electron/common/events";
import type { IEventBus } from "./eventBus";
import type {
    TPdfAnnotationCreateSource,
    TPdfAnnotationDraftTransport,
    TPdfAnnotationNavigationTarget,
    TPdfAnnotationSelectionErrorPayload,
    TPdfAnnotationSelectionTarget,
    TPdfAnnotationTransport,
} from "./pdfAnnotation.type";

export type {
    IColor,
    TPdfAnnotationCreateSource,
    TPdfAnnotationDraftTransport,
    TPdfAnnotationDrawType,
    TPdfAnnotationNavigationTarget,
    TPdfAnnotationRectTransport,
    TPdfAnnotationSelectionErrorPayload,
    TPdfAnnotationSelectionErrorReason,
    TPdfAnnotationSelectionTarget,
    TPdfAnnotationTransport,
} from "./pdfAnnotation.type";

// export type IPdfPlayerScale = "fit" | "width" | "50" | "100" | "150" | "200" | "300" | "500";
export type IPdfPlayerScale = "page-fit" | "page-width" | number;
export type IPdfPlayerView = "scrolled"; // | "paginated";
export type IPdfPlayerColumn = "auto" | "1" | "2";

export interface IPdfPlayerEvent {
    "pageNumber": (pageNumber: number) => any;
    "pageLabel": (pageLabel: string) => any;
    "firstpage": () => any;
    "lastpage": () => any;
    "scale": (scale: IPdfPlayerScale) => any;
    "view": (view: IPdfPlayerView) => any;
    "column": (column: IPdfPlayerColumn) => any;
    "spreadModeEven": (column: boolean) => any;
    "search": (searchWord: string) => any;
    "search-next": () => any;
    "search-previous": () => any;
    "search-wipe": () => any; // search bar closed
    "search-found": (foundNumber: number) => any;
    "page-next": () => any;
    "page-previous": () => any;
    "ready": () => any;
    "start": (pdfPath: string, scale: IPdfPlayerScale, spreadMode: 0 | 1 | 2) => any;
    "copy": (text: string) => any;
    "keydown": (event: IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN) => any;
    "keyup": (event: IEventPayload_R2_EVENT_WEBVIEW_KEYUP) => any;
    "toc": (event: TToc) => any;
    "numberofpages": (pages: number) => any;
    "savePreferences": (data: {
        page: number,
        zoom: string | number,
        scrollLeft: number,
        scrollTop: number,
        rotation: number,
        sidebarView: number,
        scrollMode: number,
        spreadMode: number,
      }) => any;
    "print": (pageRange: number[]) => any;
    "thumbnailRequest": (pageIndexZeroBased: number) => any;
    "thumbnailRendered": (pageNumber: number, imgSrc: string) => any;
    "annotations:sync": (payload: {
        annotations: TPdfAnnotationTransport[];
    }) => any;
    "annotations:set-instant-mode": (payload: {
        enabled: boolean;
    }) => any;
    "annotations:set-visibility": (payload: {
        visible: boolean;
    }) => any;
    "highlight:create-from-selection": () => any;
    "annotations:ready": () => any;
    "annotation:create-requested": (payload: {
        draft: TPdfAnnotationDraftTransport;
        source: TPdfAnnotationCreateSource;
    }) => any;
    "viewer:go-to-annotation": (payload: TPdfAnnotationNavigationTarget) => any;
    "annotation:selected": (payload: TPdfAnnotationSelectionTarget) => any;
    "annotation:selection-error": (payload: TPdfAnnotationSelectionErrorPayload) => any;
}

export interface IEventBusPdfPlayer extends IEventBus {

    subscribe: <TKey extends keyof IPdfPlayerEvent, TFn extends IPdfPlayerEvent[TKey]>
        (key: TKey, fn: TFn) => void;
    dispatch: <TKey extends keyof IPdfPlayerEvent>(key: TKey, ...arg: Parameters<IPdfPlayerEvent[TKey]>) => void;
    remove: <TKey extends keyof IPdfPlayerEvent>(fn: IPdfPlayerEvent[TKey], key?: TKey) => void;
    removeKey: <TKey extends keyof IPdfPlayerEvent>(key: TKey) => void;
}

// extract from publication link class
// see { Link } from "@r2-shared-js/models/publication-link";
export interface ILink {
    Href?: string;
    Title?: string;
    Children?: ILink[];
}

export type TToc = ILink[];
