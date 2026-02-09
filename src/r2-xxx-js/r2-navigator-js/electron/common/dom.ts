// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as xmldom from "@xmldom/xmldom";

export function serializeDOM(documant: Document | xmldom.Document): string {

    const isWeb = typeof window !== "undefined" && documant instanceof window.Document;
    // console.log("--DOMDOM: SERIALIZE--", isWeb);
    const serialized = isWeb
        ? new XMLSerializer().serializeToString(documant)
        : new xmldom.XMLSerializer().serializeToString(documant as xmldom.Document);

    // import * as parse5 from "parse5";
    // const serialized = parse5.serialize(documant);

    return serialized;
}

export function parseDOM(htmlStrToParse: string, mediaType: string | undefined): Document {

    // not application/xhtml+xml because:
    // https://github.com/jindw/xmldom/pull/208
    // https://github.com/jindw/xmldom/pull/242
    // https://github.com/xmldom/xmldom/blob/3db6ccf3f7ecbde73608490d71f96c727abdd69a/lib/dom-parser.js#L12
    // https://github.com/xmldom/xmldom/blob/0.9.3/lib/dom-parser.js#L220
    // https://github.com/xmldom/xmldom/blob/0.9.3/index.d.ts#L24
    // https://github.com/xmldom/xmldom/blob/0.9.3/index.d.ts#L99
    // if (mediaType === "application/xhtml+xml") {
    //     mediaType = "application/xhtml";
    // }
    if (!mediaType) {
        mediaType = "application/xml";
    }

    // type DOMParserSupportedType = "application/xhtml+xml" | "application/xml" | "image/svg+xml" | "text/html" | "text/xml"
    const isWeb = typeof window !== "undefined" && (mediaType === "application/xhtml+xml" || mediaType === "application/xml" || mediaType === "image/svg+xml" || mediaType === "text/html" || mediaType === "text/xml");
    // console.log("--DOMDOM: PARSE--", isWeb);
    const documant = isWeb
        ? new DOMParser().parseFromString(htmlStrToParse, mediaType as DOMParserSupportedType)
        : new xmldom.DOMParser().parseFromString(htmlStrToParse, mediaType);

    // import * as parse5 from "parse5";
    // const documant = parse5.parse(htmlStrToParse);

    // debug(documant.doctype);

    const docNodeJS = documant as xmldom.Document;
    const docWeb = documant as Document;
    if (!isWeb) {
        if (!docWeb.head) {
            definePropertyGetterSetter_DocHeadBody(docNodeJS, "head");
        }
        if (!docWeb.body) {
            definePropertyGetterSetter_DocHeadBody(docNodeJS, "body");
        }
        if (docWeb.documentElement && !docWeb.documentElement.style) {
            definePropertyGetterSetter_ElementStyle(docNodeJS.documentElement as xmldom.Element);
        }
        if (docWeb.body && !docWeb.body.style) {
            definePropertyGetterSetter_ElementStyle(docWeb.body as unknown as xmldom.Element);
        }
        if (docWeb.documentElement && !docWeb.documentElement.classList) {
            definePropertyGetterSetter_ElementClassList(docNodeJS.documentElement as xmldom.Element);
        }
    }

    return docWeb;
}

function definePropertyGetterSetter_ElementClassList(element: xmldom.Element) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classListObj: any = {};
    classListObj.element = element;

    classListObj.contains = classListContains.bind(classListObj);
    classListObj.add = classListAdd.bind(classListObj);
    classListObj.remove = classListRemove.bind(classListObj);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any).classList = classListObj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function classListContains(this: any, className: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const style = this;
    const elem = style.element;
    // if (isDEBUG_VISUALS(documant)) {
    //     debug(`XMLDOM - classListContains: ${className}`);
    // }

    const classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return false;
    }
    const classes = classAttr.split(" ");
    for (const clazz of classes) {
        if (clazz === className) {
            // if (isDEBUG_VISUALS(documant)) {
            //     debug(`XMLDOM - classListContains TRUE: ${className}`);
            // }
            return true;
        }
    }
    return false;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function classListAdd(this: any, className: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const style = this;
    const elem = style.element;

    // if (isDEBUG_VISUALS(documant)) {
    //     debug(`XMLDOM - classListAdd: ${className}`);
    // }

    const classAttr = elem.getAttribute("class");
    if (!classAttr) {
        elem.setAttribute("class", className);
        return;
    }
    let needsAdding = true;
    const classes = classAttr.split(" ");
    for (const clazz of classes) {
        if (clazz === className) {
            needsAdding = false;
            break;
        }
    }
    if (needsAdding) {
        elem.setAttribute("class", `${classAttr} ${className}`);
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function classListRemove(this: any, className: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const style = this;
    const elem = style.element;

    // if (isDEBUG_VISUALS(documant)) {
    //     debug(`XMLDOM - classListRemove: ${className}`);
    // }

    const classAttr = elem.getAttribute("class");
    if (!classAttr) {
        return;
    }
    const arr: string[] = [];
    const classes = classAttr.split(" ");
    for (const clazz of classes) {
        if (clazz !== className) {
            arr.push(clazz);
        }
    }
    elem.setAttribute("class", arr.join(" "));
}

function definePropertyGetterSetter_DocHeadBody(documant: xmldom.Document, elementName: string) {

    Object.defineProperty(documant, elementName, {
        get() {
            const doc = this as xmldom.Document;

            const key = elementName + "_";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((doc as any)[key]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (doc as any)[key]; // cached
            }
            if (doc.documentElement?.childNodes && doc.documentElement.childNodes.length) {
                // tslint:disable-next-line: prefer-for-of
                for (let i = 0; i < doc.documentElement.childNodes.length; i++) {
                    const child = doc.documentElement.childNodes[i];
                    if ((child as xmldom.Element).nodeType === 1) { // Node.ELEMENT_NODE
                        const element = child as xmldom.Element;
                        if (element.localName && element.localName.toLowerCase() === elementName) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (doc as any)[key] = element; // cache
                            // if (isDEBUG_VISUALS(documant)) {
                            //     debug(`XMLDOM - cached documant.${elementName}`);
                            // }
                            return element;
                        }
                    }
                }
            }
            return undefined;
        },
        set(_val) {
            console.log("documant." + elementName + " CANNOT BE SET!!");
        },
    });
}

function definePropertyGetterSetter_ElementStyle(element: xmldom.Element) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const styleObj: any = {};
    styleObj.element = element;

    styleObj.setProperty = cssSetProperty.bind(styleObj);
    styleObj.removeProperty = cssRemoveProperty.bind(styleObj);

    styleObj.item = cssStyleItem.bind(styleObj);
    Object.defineProperty(styleObj, "length", {
        get() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const style = this as any;
            const elem = style.element;

            // if (isDEBUG_VISUALS(documant)) {
            //     debug(`XMLDOM - style.length`);
            // }

            const styleAttr = elem.getAttribute("style");
            if (!styleAttr) {
                return 0;
            }
            let count = 0;
            const cssProps = styleAttr.split(";");
            for (const cssProp of cssProps) {
                if (cssProp.trim().length) {
                    count++;
                }
            }
            // if (isDEBUG_VISUALS(documant)) {
            //     debug(`XMLDOM - style.length: ${count}`);
            // }
            return count;
        },
        set(_val) {
            console.log("style.length CANNOT BE SET!!");
        },
    });

    const cssProperties = ["overflow", "width", "height", "margin", "transformOrigin", "transform"];
    cssProperties.forEach((cssProperty) => {

        Object.defineProperty(styleObj, cssProperty, {
            get() {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const style = this as any;
                const elem = style.element;

                return cssStyleGet(cssProperty, elem);
            },
            set(val) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const style = this as any;
                const elem = style.element;

                cssStyleSet(cssProperty, val, elem);
            },
        });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any).style = styleObj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cssSetProperty(this: any, cssProperty: string, val: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const style = this;
    const elem = style.element;

    // debug(`XMLDOM - cssSetProperty: ${cssProperty}: ${val};`);
    cssStyleSet(cssProperty, val, elem);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cssRemoveProperty(this: any, cssProperty: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const style = this;
    const elem = style.element;

    // debug(`XMLDOM - cssRemoveProperty: ${cssProperty}`);
    cssStyleSet(cssProperty, undefined, elem);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cssStyleItem(this: any, i: number): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const style = this;
    const elem = style.element;
    // if (isDEBUG_VISUALS(documant)) {
    //     debug(`XMLDOM - cssStyleItem: ${i}`);
    // }
    const styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    let count = -1;
    const cssProps = styleAttr.split(";");
    for (const cssProp of cssProps) {
        const trimmed = cssProp.trim();
        if (trimmed.length) {
            count++;
            if (count === i) {
                const regExStr = "(.+)[\s]*:[\s]*(.+)";
                const regex = new RegExp(regExStr, "g");
                const regexMatch = regex.exec(trimmed);
                if (regexMatch) {
                    // if (isDEBUG_VISUALS(documant)) {
                    //     debug(`XMLDOM - cssStyleItem: ${i} => ${regexMatch[1]}`);
                    // }
                    return regexMatch[1];
                }
            }
        }
    }
    return undefined;
}
function cssStyleGet(cssProperty: string, elem: Element): string | undefined {
    // if (isDEBUG_VISUALS(documant)) {
    //     debug(`XMLDOM - cssStyleGet: ${cssProperty}`);
    // }

    const styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        return undefined;
    }
    const regExStr = `${cssProperty}[\s]*:[\s]*(.+)`;
    const cssProps = styleAttr.split(";");
    let cssPropertyValue: string | undefined;
    for (const cssProp of cssProps) {
        const regex = new RegExp(regExStr, "g");
        const regexMatch = regex.exec(cssProp.trim());
        if (regexMatch) {
            cssPropertyValue = regexMatch[1];
            // if (isDEBUG_VISUALS(documant)) {
            //     debug(`XMLDOM - cssStyleGet: ${cssProperty} => ${cssPropertyValue}`);
            // }
            break;
        }
    }
    return cssPropertyValue ? cssPropertyValue : undefined;
}
function cssStyleSet(cssProperty: string, val: string | undefined, elem: Element) {
    // if (isDEBUG_VISUALS(documant)) {
    //     debug(`XMLDOM - cssStyleSet: ${cssProperty}: ${val};`);
    // }

    const str = val ? `${cssProperty}: ${val}` : undefined;

    const styleAttr = elem.getAttribute("style");
    if (!styleAttr) {
        if (str) {
            elem.setAttribute("style", str);
        }
    } else {
        const regExStr = `${cssProperty}[\s]*:[\s]*(.+)`;
        const regex = new RegExp(regExStr, "g");
        const regexMatch = regex.exec(styleAttr);
        if (regexMatch) {
            elem.setAttribute("style", styleAttr.replace(regex, str ? `${str}` : ""));
        } else {
            if (str) {
                elem.setAttribute("style", `${styleAttr}; ${str}`);
            }
        }
    }
}
