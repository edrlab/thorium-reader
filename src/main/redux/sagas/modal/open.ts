// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { forkTyped, takeTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { call, cancel, delay, join, race } from "typed-redux-saga/macro";
import { SagaGenerator } from "typed-redux-saga/dist";
import { getRequestCustomProtocolEventChannel } from "../getEventChannel";
import { createOpdsAuthenticationModalWin } from "./createModalWin";
import { IParseRequestFromCustomProtocol, parseRequestFromCustomProtocol } from "./request";

const filename_ = "readium-desktop:main/modal/flow.ts";
const debug = debug_(filename_);


export type TOpenWindowModalAndReturnResult<T = string> = {
    callback: (response: Electron.ProtocolResponse) => void,
    request: IParseRequestFromCustomProtocol<T>,
}
export function* openWindowModalAndReturnResult<T = string>
    (browserUrl: string): SagaGenerator<TOpenWindowModalAndReturnResult<T>> {


    const task = yield* forkTyped(function* () {

        const parsedRequest = yield* takeTyped(getRequestCustomProtocolEventChannel());
        return {
            request: parseRequestFromCustomProtocol<T>(parsedRequest.request),
            callback: parsedRequest.callback,
        };
    });

    const win =
        tryCatchSync(
            () => createOpdsAuthenticationModalWin(browserUrl),
            filename_,
        );

    try {
        if (!win) {
            debug("modal win undefined");
            throw "";
        }

        yield* race({
            a: delay(60000),
            b: join(task),
            c: call(
                async () =>
                    new Promise<void>((resolve) => win.on("close", () => resolve())),
            ),
        });

        if (task.isRunning()) {
            debug("no authentication credentials received");
            debug("perhaps timeout or closing authentication window occured");

        } else {

            return task.result();
        }

    } finally {

        if (win) {
            win.close();
        }
        if (task.isRunning()) {
            yield* cancel(task);
        }
    }

    return undefined;
}
