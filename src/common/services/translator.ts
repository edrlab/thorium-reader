// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable } from "inversify";

import deCatalog from "readium-desktop/resources/locales/de.json";
import enCatalog from "readium-desktop/resources/locales/en.json";
import esCatalog from "readium-desktop/resources/locales/es.json";
import fiCatalog from "readium-desktop/resources/locales/fi.json";
import frCatalog from "readium-desktop/resources/locales/fr.json";
import itCatalog from "readium-desktop/resources/locales/it.json";
import jaCatalog from "readium-desktop/resources/locales/ja.json";
import ltCatalog from "readium-desktop/resources/locales/lt.json";
import nlCatalog from "readium-desktop/resources/locales/nl.json";
import ptBrCatalog from "readium-desktop/resources/locales/pt-br.json";
import ptPtCatalog from "readium-desktop/resources/locales/pt-pt.json";
import ruCatalog from "readium-desktop/resources/locales/ru.json";
import zhCnCatalog from "readium-desktop/resources/locales/zh-cn.json";
import koCatalog from "readium-desktop/resources/locales/ko.json";
import svCatalog from "readium-desktop/resources/locales/sv.json";

import { TFunction } from "readium-desktop/typings/en.translation";

// -----------------------------------------------------------
// i18next Typescript definitions woes (esModuleInterop, WebPack bundler):

// https://github.com/i18next/i18next/pull/1291
// https://github.com/i18next/i18next/issues/1271
// https://github.com/i18next/i18next/issues/1177

// CHANGES:
// https://github.com/i18next/i18next/blob/master/CHANGELOG.md#1900
// https://github.com/i18next/i18next/pull/1352

// import i18next from "i18next"; // the "default" export (unfortunately, WebPack generates i18next_1.default!)
import { i18n } from "i18next"; // named export: just the TypeScript type

// node_modules/i18next/package.json
// =>
// "main" CJS "./dist/cjs/i18next.js",
// "module" ESM "./dist/esm/i18next.js",
// ... depends on WebPack bundler strategy, matrix: DEV vs. PROD, and MAIN vs. RENDERER

// ##### technique 1:
// import i18next from "i18next"; // doesn't work with unit tests
import * as i18next from "i18next";
//
// ##### technique 2:
// import i18next = require("i18next");
//
// ##### technique 3:
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const i18next: i18n = require("i18next");

// ##### technique 4 (force CJS):
// const i18next: i18n = require("i18next/dist/cjs/i18next");

// ##### technique 5 (force ESM):
// const i18next: i18n = require("i18next/dist/esm/i18next");

// const i18nextInstance = i18next.createInstance(); // it should be as simple as that :(
let i18nextInstance: i18n | undefined;
if ((i18next as unknown as i18n).createInstance) {
    i18nextInstance = (i18next as unknown as i18n).createInstance();

} else if (((i18next as any).default as i18n).createInstance) {
    i18nextInstance = ((i18next as any).default as i18n).createInstance();

} else { // Fallback for TS compiler only (not an actual runtime occurrence)
    i18nextInstance = i18next as unknown as i18n;
}
// -----------------------------------------------------------

// https://www.i18next.com/overview/configuration-options
i18nextInstance.init({
    // --
    // https://github.com/i18next/i18next/pull/1584
    // https://github.com/i18next/i18next/blob/master/CHANGELOG.md#2000
    // --
    // https://github.com/i18next/i18next/issues/1589
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ignoreJSONStructure: false,
    debug: false,
    resources: {
        "en": {
            translation: enCatalog,
        },
        "fr": {
            translation: frCatalog,
        },
        "fi": {
            translation: fiCatalog,
        },
        "de": {
            translation: deCatalog,
        },
        "es": {
            translation: esCatalog,
        },
        "nl": {
            translation: nlCatalog,
        },
        "ja": {
            translation: jaCatalog,
        },
        "lt": {
            translation: ltCatalog,
        },
        "pt-BR": {
            translation: ptBrCatalog,
        },
        "pt-PT": {
            translation: ptPtCatalog,
        },
        "zh-CN": {
            translation: zhCnCatalog,
        },
        "it" : {
            translation: itCatalog,
        },
        "ru" : {
            translation: ruCatalog,
        },
        "ko": {
            translation: koCatalog,
        },
        "sv": {
            translation: svCatalog,
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

const i18nextInstanceEN = i18nextInstance.cloneInstance();
i18nextInstanceEN.changeLanguage("en").then((_t) => {
    // noop
}).catch((err) => {
    console.log(err);
});

// can use ObjectValues or ObjectKeys from
// src/utils/object-keys-values.ts
// to benefit from compile-type TypeScript typesafe key enum
export const AvailableLanguages = {
    "en": "English",
    "fr": "Français",
    "fi": "Suomi",
    "de": "Deutsch",
    "es": "Español",
    "nl": "Dutch",
    "ja": "日本語",
    "lt": "Lietuvių",
    "pt-BR": "Português Brasileiro",
    "pt-PT": "Português",
    "zh-CN": "中文",
    "it": "Italiano",
    "ru": "Русский",
    "ko": "한국어",
    "sv": "Svenska",
};

interface LocalizedContent {
    [locale: string]: string;
}

export type I18nTyped = TFunction;

@injectable()
export class Translator {
    public translate: I18nTyped = this._translate;
    private locale = "en";

    public getLocale(): string {
        return this.locale;
    }

    public async setLocale(locale: string) {
        this.locale = locale;

        return new Promise<void>((resolve, reject) => {

            if (i18nextInstance.language !== this.locale) {
                // https://github.com/i18next/i18next/blob/master/CHANGELOG.md#1800
                // i18nextInstance.language not instantly ready (because async loadResources()),
                // but i18nextInstance.isLanguageChangingTo immediately informs which locale i18next is switching to.
                i18nextInstance.changeLanguage(this.locale).then((_t) => {
                    resolve();
                }).catch((err) => {
                    console.log(err);
                    reject(err);
                });
            } else {
                resolve();
            }
        });
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

    private _translate(message: string, options: any = {}): any { // TODO any?!
        const label = i18nextInstance.t(message, options);
        if (!label || !label.length) {
            return i18nextInstanceEN.t(message, options);
        }
        return label;
    }
}
