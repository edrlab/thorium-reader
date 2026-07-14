// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { IStringMap } from "@r2-shared-js/models/metadata-multilang";

// SEE PACKAGE.JSON:
// ar bg brh ca cs da de el en es et eu fi fr gl he hr it ja ka ko lt nl pl pt-br pt-pt ru sl sv ta tr zh-cn zh-tw
// 33 languages
// minus 6 incomplete ones (see `__TH__IS_DEV__ || __TH__IS_CI__` in this source file)
// ==> 27 supported locales in PROD (see `appx` in `package.json`)
import arCatalog from "readium-desktop/resources/locales/ar.json";
import bgCatalog from "readium-desktop/resources/locales/bg.json";
import brhCatalog from "readium-desktop/resources/locales/brh.json";
import caCatalog from "readium-desktop/resources/locales/ca.json";
import csCatalog from "readium-desktop/resources/locales/cs.json";
import daCatalog from "readium-desktop/resources/locales/da.json";
import deCatalog from "readium-desktop/resources/locales/de.json";
import elCatalog from "readium-desktop/resources/locales/el.json";
import enCatalog from "readium-desktop/resources/locales/en.json";
import esCatalog from "readium-desktop/resources/locales/es.json";
import etCatalog from "readium-desktop/resources/locales/et.json";
import euCatalog from "readium-desktop/resources/locales/eu.json";
import fiCatalog from "readium-desktop/resources/locales/fi.json";
import frCatalog from "readium-desktop/resources/locales/fr.json";
import glCatalog from "readium-desktop/resources/locales/gl.json";
import heCatalog from "readium-desktop/resources/locales/he.json";
import hrCatalog from "readium-desktop/resources/locales/hr.json";
import itCatalog from "readium-desktop/resources/locales/it.json";
import jaCatalog from "readium-desktop/resources/locales/ja.json";
import kaCatalog from "readium-desktop/resources/locales/ka.json";
import koCatalog from "readium-desktop/resources/locales/ko.json";
import ltCatalog from "readium-desktop/resources/locales/lt.json";
import nlCatalog from "readium-desktop/resources/locales/nl.json";
import plCatalog from "readium-desktop/resources/locales/pl.json";
import ptBrCatalog from "readium-desktop/resources/locales/pt-br.json";
import ptPtCatalog from "readium-desktop/resources/locales/pt-pt.json";
import ruCatalog from "readium-desktop/resources/locales/ru.json";
import slCatalog from "readium-desktop/resources/locales/sl.json";
import svCatalog from "readium-desktop/resources/locales/sv.json";
import taCatalog from "readium-desktop/resources/locales/ta.json";
import trCatalog from "readium-desktop/resources/locales/tr.json";
import zhCnCatalog from "readium-desktop/resources/locales/zh-cn.json";
import zhTwCatalog from "readium-desktop/resources/locales/zh-tw.json";


// import { TFunction } from "readium-desktop/typings/en.translation";
import { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";


import i18next from "i18next";

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
        "ar": {
            translation: arCatalog,
        },
        "ca": {
            translation: caCatalog,
        },
        "cs": {
            translation: csCatalog,
        },
        "da": {
            translation: daCatalog,
        },
        "de": {
            translation: deCatalog,
        },
        "el": {
            translation: elCatalog,
        },
        "en": {
            translation: enCatalog,
        },
        "es": {
            translation: esCatalog,
        },
        "et": {
            translation: etCatalog,
        },
        "eu": {
            translation: euCatalog,
        },
        "fi": {
            translation: fiCatalog,
        },
        "fr": {
            translation: frCatalog,
        },
        "gl": {
            translation: glCatalog,
        },
        "it" : {
            translation: itCatalog,
        },
        "ja": {
            translation: jaCatalog,
        },
        "lt": {
            translation: ltCatalog,
        },
        "nl": {
            translation: nlCatalog,
        },
        "pl": {
            translation: plCatalog,
        },
        "pt-BR": {
            translation: ptBrCatalog,
        },
        "pt-PT": {
            translation: ptPtCatalog,
        },
        "ru" : {
            translation: ruCatalog,
        },
        "sl": {
            translation: slCatalog,
        },
        "sv": {
            translation: svCatalog,
        },
        "ta": {
            translation: taCatalog,
        },
        "tr": {
            translation: trCatalog,
        },
        "zh-CN": {
            translation: zhCnCatalog,
        },
        "zh-TW": {
            translation: zhTwCatalog,
        },
        ...(__TH__IS_DEV__ || __TH__IS_CI__ ?
        {
            "bg": {
                translation: bgCatalog,
            },
            "brh": {
                translation: brhCatalog,
            },
            "he": {
                translation: heCatalog,
            },
            "hr": {
                translation: hrCatalog,
            },
            "ka": {
                translation: kaCatalog,
            },
            "ko": {
                translation: koCatalog,
            },
        }
        :{}),
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
    "ar": "عَرَبِيّ (Arabic)",
    "ca": "Catalan",
    "cs": "čeština (Czech)",
    "da": "Dansk (Danish)",
    "de": "Deutsch (German)",
    "el": "ελληνικός (Greek)",
    "en": "English",
    "es": "Español (Spanish)",
    "et": "Eesti Keel (Estonian)",
    "eu": "Euskadi (Basque)",
    "fi": "Suomi (Finnish)",
    "fr": "Français (French)",
    "gl": "Galician",
    "it": "Italiano (Italian)",
    "ja": "日本語 (Japanese)",
    "lt": "Lietuvių (Lithuanian)",
    "nl": "Nederlands (Dutch)",
    "pl": "Polski (Polish)",
    "pt-BR": "Português Brasileiro (Portuguese - Brazil)",
    "pt-PT": "Português (Portuguese - Portugal)",
    "ru": "Русский (Russian)",
    "sl": "Slovenščina (Slovene)",
    "sv": "Svenska (Swedish)",
    "ta": "தமிழ் (Tamil)",
    "tr": "Türkçe (Turkish)",
    "zh-CN": "简体中文 - 中国 (Simplified Chinese / China)",
    "zh-TW": "繁體中文 - 台灣 (Traditional Chinese / Taiwan)",
    ...(__TH__IS_DEV__ || __TH__IS_CI__ ?
    {
        "bg": "български (Bulgarian)",
        "brh": "براہوئی (Brahui)",
        "he": "עִבְרִית (Hebrew)",
        "hr": "Hrvatski (Croatian)",
        "ka": "ქართული (Georgian)",
        "ko": "한국어 (Korean)",
    }
    :{}),
};

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

// type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
// type TParams = ArgumentTypes<typeof i18next.t>;
// type TParams = Parameters<typeof i18next.t>;
export const translate = (...args: Parameters<typeof i18next.t>): ReturnType<typeof i18next.t> => {
    const label = i18nextInstance.t(...args);
    if (!label || !label.length) {
        // fallbackLng: "en" does not take into account empty string (which we output to normalise JSON locales)
        return i18nextInstanceEN.t(...args);
    }
    return label;
};

// SEE: convertMultiLangStringToLangString() or convertMultiLangStringToString()
// export const translateContentFieldHelper = (stringOrObject: string | IStringMap, locale: keyof typeof availableLanguages): string => {
//     if (!stringOrObject) {
//         return "";
//     }

//     if (typeof stringOrObject === "string") {
//         return stringOrObject;
//     }

//     if (typeof stringOrObject !== "object") {
//         return "";
//     }

//     if (stringOrObject[locale]) {
//         return stringOrObject[locale];
//     }

//     const keys = Object.keys(stringOrObject);

//     // Check if there is no composed locale names matching with the current locale
//     const simplifiedFieldLocales = keys.filter(
//         (locale) => locale.split("-")[0] === locale.split("-")[0],
//     );
//     if (simplifiedFieldLocales.length) {
//         return stringOrObject[simplifiedFieldLocales[0]];
//     }

//     // If nothing try to take an english locale
//     const englishFieldLocales = keys.filter(
//         (locale) => locale.split("-")[0] === "en",
//     );
//     if (englishFieldLocales.length) {
//         return stringOrObject[englishFieldLocales[0]];
//     }

//     // Take the first locale if nothing match with current locale or english

//     if (keys && keys.length) {
//         return stringOrObject[keys[0]];
//     }

//     return "";
// };

export const translator = {
    __: translate,
    setLocale,
    translate,
};
export const getTranslator = () => translator;
