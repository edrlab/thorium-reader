// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as i18n from "i18next";
import { injectable} from "inversify";

import * as enCatalog from "readium-desktop/resources/locales/en.json";
import * as frCatalog from "readium-desktop/resources/locales/fr.json";

i18n.init({
    resources: {
        en: {
            translation: enCatalog,
        },
        fr: {
            translation: frCatalog,
        },
    },
});

@injectable()
export class Translator {
    private locale: string = "en";

    public getLocale(): string {
        return this.locale;
    }

    public setLocale(locale: string) {
        this.locale = locale;
    }

    public translate(message: string, options: any = {}): string {
        if (i18n.language !== this.locale) {
            i18n.changeLanguage(this.locale);
        }

        return i18n.t(message, options);
    }
}
