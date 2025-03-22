// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "./redux";

export enum SenderType {
    Main, // Main process
    Renderer, // Renderer process
}

export interface WindowSender {
    type: SenderType;
    identifier: string;
}

export interface WithSender {
    sender: WindowSender;
}

export interface WindowReaderDestination {
    identifier: string;
}
export interface WithDestination {
    destination: WindowReaderDestination;
}

export interface AcrossRenderer {
    sendActionAcrossRenderer: boolean;
}

export interface ActionWithSender<Type extends string = string, Payload = undefined, Meta = undefined> extends Action<Type, Payload, Meta>, WithSender {
}

export interface ActionWithDestination<Type extends string = string, Payload = undefined, Meta = undefined> extends Action<Type, Payload, Meta>, WithDestination {
}

export interface ActionAcrossRenderer<Type extends string = string, Payload = undefined, Meta = undefined> extends Action<Type, Payload, Meta>, AcrossRenderer {
}
