// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { I18nTyped } from "readium-desktop/common/services/translator";
import { diRendererGet } from "readium-desktop/renderer/di";
import { ReactComponent } from "../reactComponent";

// tslint:disable-next-line:callable-types
export function translatorDecorator<T extends { new(...args: any[]): ReactComponent }>(component: T) {
    return class extends component {

        constructor(...args: any[]) {
            super(...args);

            const translatorFromDi = diRendererGet("translator");
//           const translateBind = translatorFromDi.translate.bind(translatorFromDi) as I18nTyped;

            this.__ = translatorFromDi.translate;
        }
    };
}
