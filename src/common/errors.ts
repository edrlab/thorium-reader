// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export class CodeError extends Error {
    public static fromJson(json: any): CodeError {
        return new CodeError(
            json.code,
            json.message,
        );
    }

    public code: number | string;
    public message: string;

    constructor(code: number | string, message?: string) {
        super(message);
        this.code = code;
        this.message = message;
    }

    public toJson() {
        return {
            class: "CodeError",
            code: this.code,
            message: this.message,
        };
    }
}
