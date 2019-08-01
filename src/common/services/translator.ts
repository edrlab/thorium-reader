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

import * as deLang from "readium-desktop/resources/locale-names/enLang.json";
import * as enLang from "readium-desktop/resources/locale-names/enLang.json";
import * as frLang from "readium-desktop/resources/locale-names/frLang.json";

const initI18n = i18n.init({
    fallbackLng: "en",
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

const initI18nEN = initI18n.cloneInstance();
initI18nEN.changeLanguage("en");

export enum AvailableLanguages {
    en = "English",
    fr = "Français",
    de = "Deutch",
}

interface LocalizedContent {
    [locale: string]: string;
}

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
        if (initI18n.language !== this.locale) {
            initI18n.changeLanguage(this.locale);
        }

        const label = initI18n.t(message, options);
        if (!label || !label.length) {
            return initI18nEN.t(message, options);
        }
        return label;
    }

    /**
     * Translate content field that is not provided
     * by an i18n catalog
     * Field could be a string or an array
     *
     * @param text
     */
    public translateContentField(field: string | LocalizedContent) {
        if (!field) {
            return "";
        }

        if (typeof field === "string") {
            return field;
        }

        if (field[this.locale]) {
            return field[this.locale];
        }

        // Check if there is no composed locale names matching with the current locale
        const simplifiedFieldLocales = Object.keys(field).filter(
            (locale) => locale.split("-")[0] === this.locale.split("-")[0],
        );
        if (simplifiedFieldLocales.length) {
            return field[simplifiedFieldLocales[0]];
        }

        // If nothing try to take an english locale
        const englishFieldLocales = Object.keys(field).filter(
            (locale) => locale.split("-")[0] === "en",
        );
        if (englishFieldLocales.length) {
            return field[englishFieldLocales[0]];
        }

        // Take the first locale if nothing match with current locale or english
        const keys = Object.keys(field);

        if (keys && keys.length) {
            return field[keys[0]];
        }

        return "";
    }
}
