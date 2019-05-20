// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as i18n from "i18next";
import { injectable} from "inversify";

import * as deCatalog from "readium-desktop/resources/locales/de.json";
import * as enCatalog from "readium-desktop/resources/locales/en.json";
import * as frCatalog from "readium-desktop/resources/locales/fr.json";

import * as deLang from "readium-desktop/resources/locales/enLang.json";
import * as enLang from "readium-desktop/resources/locales/enLang.json";
import * as frLang from "readium-desktop/resources/locales/frLang.json";

const initI18n = i18n.init({
    resources: {
        en: {
            translation: enCatalog,
        },
        fr: {
            translation: frCatalog,
        },
        de: {
            translation: deCatalog,
        },
    },
});

initI18n.addResourceBundle("en", "translation", enLang, true);
initI18n.addResourceBundle("fr", "translation", frLang, true);
initI18n.addResourceBundle("de", "translation", deLang, true);

export enum AvailableLanguages {
    en = "English",
    fr = "Français",
    de = "Deutch",
}

@injectable()
export class Translator {
    private locale: string = "en";

    public getLocale(): string {
        return this.locale;
    }

    public setLocale(locale: string) {
        // console.log("setLocale = " + locale );
        this.locale = locale;
    }

    public translate(message: string, options: any = {}): string {
        // console.log("translator -> " + message + " locale -> " + this.locale);
        if (initI18n.language !== this.locale) {
            // console.log("locale -> " + this.locale);
            initI18n.changeLanguage(this.locale);
        }

        return initI18n.t(message, options);
    }

    /**
     * Translate content field that is not provided
     * by an i18n catalog
     * Field could be a string or an array
     *
     * @param text
     */
    public translateContentField(field: any) {
        if (!field) {
            return "";
        }

        if (typeof field === "string") {
            return field;
        }

        if (field[this.locale]) {
            return field[this.locale];
        }

        const keys = Object.keys(field);

        if (keys && keys.length) {
            return field[keys[0]];
        }

        return "";
    }
}
