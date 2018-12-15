import * as request from "request";

export async function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) {
                reject(error);
            }

            resolve(body);
        });
    });
}

export function convertMultiLangStringToString(item: any): string {
    if (typeof(item) === "string") {
        return item;
    }

    // This is an object
    const langs = Object.keys(item);

    if (langs.length === 0) {
        return null;
    }

    // FIXME: returns the string for a given languae
    const lang = langs[0];
    return item[lang];
}

export function convertContributorArrayToStringArray(items: any): string[] {
    if (!items) {
        return  [];
    }

    const itemParts = items.map((item: any) => {
        if (typeof(item.Name) === "object") {
            return Object.values(item.Name);
        }

        return [item.Name];
    });

    let newItems: any = [];

    for (const itemPart of itemParts) {
        newItems = newItems.concat(itemPart);
    }

    return newItems;
}
