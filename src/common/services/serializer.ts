// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";

import { CodeError } from "readium-desktop/common/errors";

@injectable()
export class ActionSerializer {
    public serialize(action: any) {
        if (action.error && action.payload instanceof CodeError) {
            return Object.assign(
                {},
                action,
                {
                    payload: action.payload.toJson(),
                },
            );
        } else {
            return action;
        }
    }

    public deserialize(json: any): any {
        if (json.error &&
            json.payload.class &&
            json.payload.class === "CodeError"
        ) {
            return Object.assign(
                {},
                json,
                {
                    payload: new CodeError(
                        json.payload.code,
                        json.payload.message,
                    ),
                },
            );
        } else {
            return json;
        }
    }
}
