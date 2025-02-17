// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import deCatalog from "readium-desktop/resources/locales/de.json";
import enCatalog from "readium-desktop/resources/locales/en.json";
import esCatalog from "readium-desktop/resources/locales/es.json";
import fiCatalog from "readium-desktop/resources/locales/fi.json";
import frCatalog from "readium-desktop/resources/locales/fr.json";
import itCatalog from "readium-desktop/resources/locales/it.json";
import jaCatalog from "readium-desktop/resources/locales/ja.json";
import kaCatalog from "readium-desktop/resources/locales/ka.json";
import ltCatalog from "readium-desktop/resources/locales/lt.json";
import nlCatalog from "readium-desktop/resources/locales/nl.json";
import ptBrCatalog from "readium-desktop/resources/locales/pt-br.json";
import ptPtCatalog from "readium-desktop/resources/locales/pt-pt.json";
import ruCatalog from "readium-desktop/resources/locales/ru.json";
import zhCnCatalog from "readium-desktop/resources/locales/zh-cn.json";
import zhTwCatalog from "readium-desktop/resources/locales/zh-tw.json";
import koCatalog from "readium-desktop/resources/locales/ko.json";
import svCatalog from "readium-desktop/resources/locales/sv.json";
import caCatalog from "readium-desktop/resources/locales/ca.json";
import glCatalog from "readium-desktop/resources/locales/gl.json";
import euCatalog from "readium-desktop/resources/locales/eu.json";
import elCatalog from "readium-desktop/resources/locales/el.json";
import bgCatalog from "readium-desktop/resources/locales/bg.json";
import hrCatalog from "readium-desktop/resources/locales/hr.json";
import daCatalog from "readium-desktop/resources/locales/da.json";
import slCatalog from "readium-desktop/resources/locales/sl.json";

// import { TFunction } from "readium-desktop/typings/en.translation";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";


import i18next, { TOptions } from "i18next";

const i18nextInstance = i18next.createInstance();

// https://www.i18next.com/overview/configuration-options
i18nextInstance.init({
    // https://www.i18next.com/misc/migration-guide#v-20-x-x-to-v-21-0-0
    // https://www.i18next.com/misc/migration-guide#v23.x.x-to-v24.0.0
    // https://github.com/i18next/i18next-v4-format-converter
    compatibilityJSON: "v4",
    interpolation: {
        skipOnVariables: false,
    },
    nsSeparator: ":",
    keySeparator: ".",
    // supportedLngs: LANGUAGE_KEYS,
    // nonExplicitSupportedLngs: true,
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
        "ka": {
            translation: kaCatalog,
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
        "zh-TW": {
            translation: zhTwCatalog,
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
        "ca": {
            translation: caCatalog,
        },
        "gl": {
            translation: glCatalog,
        },
        "eu": {
            translation: euCatalog,
        },
        "el": {
            translation: elCatalog,
        },
        "bg": {
            translation: bgCatalog,
        },
        "hr": {
            translation: hrCatalog,
        },
        "da": {
            translation: daCatalog,
        },
        "sl": {
            translation: slCatalog,
        },
    },
    // lng: undefined,
    fallbackLng: "en",
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
export const availableLanguages = {
    "en": "English",
    "fr": "Français (French)",
    "fi": "Suomi (Finnish)",
    "de": "Deutsch (German)",
    "es": "Español (Spanish)",
    "nl": "Nederlands (Dutch)",
    "ja": "日本語 (Japanese)",
    "ka": "ქართული (Georgian)",
    "lt": "Lietuvių (Lithuanian)",
    "pt-BR": "Português Brasileiro (Portuguese - Brazil)",
    "pt-PT": "Português (Portuguese - Portugal)",
    "zh-TW": "繁體中文 - 台灣 (Traditional Chinese / Taiwan)",
    "zh-CN": "简体中文 - 中国 (Simplified Chinese / China)",
    "it": "Italiano (Italian)",
    "ru": "Русский (Russian)",
    "ko": "한국어 (Korean)",
    "sv": "Svenska (Swedish)",
    "ca": "Catalan",
    "gl": "Galician",
    "eu": "Euskadi (Basque)",
    "el": "ελληνικός (Greek)",
    "bg": "български (Bulgarian)",
    "hr": "Hrvatski (Croatian)",
    "da": "Dansk (Danish)",
    "sl": "Slovenščina (Slovene)",
};

interface LocalizedContent {
    [locale: string]: string;
}

export type I18nFunction = (_: TTranslatorKeyParameter, __?: {}) => string;

export const setLocale = async (newLocale: keyof typeof availableLanguages) => {

    if (i18nextInstance.language !== newLocale) {
        // https://github.com/i18next/i18next/blob/master/CHANGELOG.md#1800
        // i18nextInstance.language not instantly ready (because async loadResources()),
        // but i18nextInstance.isLanguageChangingTo immediately informs which locale i18next is switching to.
        await i18nextInstance.changeLanguage(newLocale);
    }
    return ;
};

export const translate = (message: string, options: TOptions = {}): string => {
    const label = i18nextInstance.t(message, options);
    if (!label || !label.length) {
        return i18nextInstanceEN.t(message, options);
    }
    return label;
};

export const translateContentFieldHelper = (field: string | LocalizedContent, locale: keyof typeof availableLanguages): string => {
    if (!field) {
        return "";
    }

    if (typeof field === "string") {
        return field;
    }

    if (field[locale]) {
        return field[locale];
    }

    // Check if there is no composed locale names matching with the current locale
    const simplifiedFieldLocales = Object.keys(field).filter(
        (locale) => locale.split("-")[0] === locale.split("-")[0],
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
};

export const translator = {
    __: translate,
    setLocale,
    translate,
};
export const getTranslator = () => translator;
