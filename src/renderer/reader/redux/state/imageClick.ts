// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IEventPayload_R2_EVENT_IMAGE_CLICK } from "@r2-navigator-js/electron/common/events";

export interface IImageClickStatePlusDomParsing {

    dom_beforeText: string;
    dom_afterText: string;
    dom_detailsText: string;
    dom_describedbyText: string;
    dom_labelledByText: string;
    dom_figcaptionText: string;
}

export type IImageClickState = ({
    open: true;
} & IEventPayload_R2_EVENT_IMAGE_CLICK & Partial<IImageClickStatePlusDomParsing>) | ({
    open: false;
} & Partial<IEventPayload_R2_EVENT_IMAGE_CLICK> & Partial<IImageClickStatePlusDomParsing>);

export const defaultImageClickState: IImageClickState = { open: false };
