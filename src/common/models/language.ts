/**
 * A Language
 */
export interface Language {
    code: string; // Iso code on 2 or 3 chars
}

export const getMultiLangString = (titleObj: any, lang?: string) => {

    if (!titleObj) {
        return "";
    }

    if (typeof titleObj === "string") {
        return titleObj;
    }

    if (lang && titleObj[lang]) {
        return titleObj[lang];
    }

    const keys = Object.keys(titleObj);
    if (keys && keys.length) {
        return titleObj[keys[0]];
    }

    return "";
}
