// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";

import * as deCatalog from "readium-desktop/resources/locales/de.json";
import * as enCatalog from "readium-desktop/resources/locales/en.json";
import * as frCatalog from "readium-desktop/resources/locales/fr.json";

import * as deLang from "readium-desktop/resources/locale-names/deLang.json";
import * as enLang from "readium-desktop/resources/locale-names/enLang.json";
import * as frLang from "readium-desktop/resources/locale-names/frLang.json";
import { TFunction } from "readium-desktop/typings/en.translation";

// -----------------------------------------------------------
// i18next Typescript definitions woes:

// https://github.com/i18next/i18next/pull/1291
// https://github.com/i18next/i18next/issues/1271
// https://github.com/i18next/i18next/issues/1177

// import i18next from "i18next"; // Fails because of esModuleInterop
// import i18n from "i18next"; // Fails because of esModuleInterop

import { i18n } from "i18next"; // just the TypeScript type

// (default i18next package.json is "module" ESM (i18next/dist/esm/i18next),
// but may also be "main" CJS (i18next/dist/cjs/i18next),
// depending on WebPack bundler strategy matrix: DEV vs. PROD, and MAIN vs. RENDERER

// ##### technique 1:
import * as i18next from "i18next";
//
// ##### technique 2:
// import i18next = require("i18next");
//
// ##### technique 3:
// tslint:disable-next-line: no-var-requires
// const i18next: i18n = require("i18next");
//
// DEV:
// MAIN => i18next.createInstance(),
// RENDERER => i18next.default.createInstance()
//
// PROD:
// MAIN => i18next.default.createInstance(),
// RENDERER => i18next.default.createInstance()

// ##### technique 4 (force CJS):
// tslint:disable-next-line: no-var-requires
// const i18next: i18n = require("i18next/dist/cjs/i18next");
//
// DEV:
// MAIN => i18next.createInstance(),
// RENDERER => i18next.createInstance()
//
// PROD:
// MAIN => i18next.createInstance(),
// RENDERER => i18next.createInstance()

// ##### technique 5 (force ESM):
// tslint:disable-next-line: no-var-requires
// const i18next: i18n = require("i18next/dist/esm/i18next");
//
// DEV:
// MAIN => fail
// RENDERER => fail
//
// PROD:
// MAIN => i18next.default.createInstance(),
// RENDERER => i18next.default.createInstance()

let i18nextInstance: i18n | undefined;
if (i18next.createInstance) {
    i18nextInstance = i18next.createInstance();

} else if (((i18next as any).default as i18n).createInstance) {
    i18nextInstance = ((i18next as any).default as i18n).createInstance();

} else { // Fallback for TS compiler only (not an actual runtime occurrence)
    i18nextInstance = i18next;
}
// -----------------------------------------------------------

// https://www.i18next.com/overview/configuration-options
i18nextInstance.init({
    debug: false,
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
    // lng: undefined,
    fallbackLng: "en",
    // whitelist: LANGUAGE_KEYS,
    // nonExplicitWhitelist: true,
    // load: "all",
    // preload: LANGUAGE_KEYS,
    // lowerCaseLng: false,
    // saveMissing: true,
    // missingKeyHandler: (lng, ns, key, fallbackValue, updateMissing, options) => {
    //     if (!options || !options.ignoreMissingKey) {
    //         winston.info('i18next missingKey: ' + key);
    //     }
    //     return key;
    // },
}).then((_t) => {
    // noop
}).catch((err) => {
    console.log(err);
});

i18nextInstance.addResourceBundle("en", "translation", enLang, true);
i18nextInstance.addResourceBundle("fr", "translation", frLang, true);
i18nextInstance.addResourceBundle("de", "translation", deLang, true);

const i18nextInstanceEN = i18nextInstance.cloneInstance();
i18nextInstanceEN.changeLanguage("en").then((_t) => {
    // noop
}).catch((err) => {
    console.log(err);
});

export enum AvailableLanguages {
    en = "English",
    fr = "Français",
    de = "Deutch",
}

interface LocalizedContent {
    [locale: string]: string;
}

export type I18nTyped = TFunction;

@injectable()
export class Translator {
    public translate: I18nTyped = this._translate;
    private locale: string = "en";

    public getLocale(): string {
        return this.locale;
    }

    public setLocale(locale: string) {
        this.locale = locale;
        if (i18nextInstance.language !== this.locale) {
            i18nextInstance.changeLanguage(this.locale).then((_t) => {
                // noop
            }).catch((err) => {
                console.log(err);
            });
        }
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

    private _translate(message: string, options: any = {}): any {
        const label = i18nextInstance.t(message, options);
        if (!label || !label.length) {
            return i18nextInstanceEN.t(message, options);
        }
        return label;
    }
}
