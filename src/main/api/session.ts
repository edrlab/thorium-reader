// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { inject, injectable } from "inversify";
import { ISessionApi } from "readium-desktop/common/api/interface/session.interface";
import { type Store } from "redux";

import { diSymbolTable } from "../diSymbolTable";
import { sessionActions } from "../redux/actions";
import { RootState } from "../redux/states";

// import * as debug_ from "debug";
// Logger
// const debug = debug_("readium-desktop:src/main/api/opds");

@injectable()
export class SessionApi implements ISessionApi {

    @inject(diSymbolTable.store)
    private readonly store!: Store<RootState>;

    public async isEnabled(): Promise<boolean> {
        const value = this.store.getState().session.state;
        return Promise.resolve(value);
    }

    public async enable(value: boolean): Promise<void> {
        this.store.dispatch(sessionActions.enable.build(value));

        return Promise.resolve();
    }
}
