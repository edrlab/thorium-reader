// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    HighlightDrawTypeBackground,
    HighlightDrawTypeMarginBookmark,
    HighlightDrawTypeOutline,
    HighlightDrawTypeStrikethrough,
    HighlightDrawTypeUnderline,
} from "@r2-navigator-js/electron/common/highlight";

export type TDrawType = "solid_background" | "underline" | "strikethrough" | "outline" | "bookmark";

export const noteDrawType: TDrawType[] = [
    "solid_background",
    "underline",
    "strikethrough",
    "outline",
];

export type TDrawView = "annotation" | "margin" | "hide";

export enum EDrawType {
    "solid_background" = HighlightDrawTypeBackground,
    "underline" = HighlightDrawTypeUnderline,
    "strikethrough" = HighlightDrawTypeStrikethrough,
    "outline" = HighlightDrawTypeOutline,
    "bookmark" = HighlightDrawTypeMarginBookmark,
}
