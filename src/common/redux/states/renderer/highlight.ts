// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IHighlight, IHighlightDefinition } from "@r2-navigator-js/electron/common/highlight";

export interface IHighlightBaseState {
    uuid: string;
}

export interface IHighlightHandlerState extends IHighlightBaseState {
    href: string;
    // type: "search" | "annotation";
    def: IHighlightDefinition;
}

export interface IHighlightMounterState extends IHighlightBaseState {
  href: string;
  // type: IHighlightHandlerState["type"];
  ref: IHighlight;
}
