// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";

import { CodeError } from "readium-desktop/common/errors";

import { Action } from "../models/redux";

@injectable()
export class ActionSerializer {
    public serialize(action: Action<string, any>): Action<string, any> {
        if (action.error && action.payload instanceof CodeError) {
            return Object.assign(
                {},
                action,
                {
                    payload: (action.payload as CodeError).toJson(),
                } as Action<string, any>,
            );
        } else {
            return action;
        }
    }

    public deserialize(json: Action<string, any>): Action<string, any> {
        if (json.error &&
            json.payload &&
            json.payload.class &&
            json.payload.class === "CodeError"
        ) {
            return Object.assign(
                {},
                json,
                {
                    payload: CodeError.fromJson({
                        code: json.payload.code,
                        message: json.payload.message,
                    }),
                } as Action<string, any>,
            );
        } else {
            return json;
        }
    }
}
