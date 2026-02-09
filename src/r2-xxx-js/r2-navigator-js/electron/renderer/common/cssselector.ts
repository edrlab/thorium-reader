// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// tslint:disable-next-line:max-line-length
// https://github.com/fczbkk/css-selector-generator-benchmark/blob/master/README.md#chromiums-dompresentationutils

// tslint:disable-next-line:max-line-length
// https://chromium.googlesource.com/chromium/blink/+/master/Source/devtools/front_end/components/DOMPresentationUtils.js#259
export const fullQualifiedSelector = (node: Node, justSelector: boolean): string => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        const lowerCaseName = ((node as Element).localName && (node as Element).localName.toLowerCase())
            || node.nodeName.toLowerCase();
        return lowerCaseName;
    }
    return cssPath(node, justSelector);
};

interface IDOMNodePathStep {
    optimized: boolean;
    value: string;
}

// tslint:disable-next-line:max-line-length
// https://chromium.googlesource.com/chromium/blink/+/master/Source/devtools/front_end/components/DOMPresentationUtils.js#289
const cssPath = (node: Node, optimized: boolean): string => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
    }

    const steps = [];
    let contextNode = node;
    while (contextNode) {
        const step = _cssPathStep(contextNode, !!optimized, contextNode === node);
        if (!step) {
            break; // Error - bail out early.
        }
        steps.push(step.value);
        if (step.optimized) {
            break;
        }
        contextNode = contextNode.parentNode as Node;
    }
    steps.reverse();
    return steps.join(" > ");
};

// tslint:disable-next-line:max-line-length
// https://chromium.googlesource.com/chromium/blink/+/master/Source/devtools/front_end/components/DOMPresentationUtils.js#316
const _cssPathStep = (node: Node, optimized: boolean, isTargetNode: boolean): IDOMNodePathStep | undefined => {

    const prefixedElementClassNames = (nd: Element): string[] => {
        const classAttribute = nd.getAttribute("class");
        if (!classAttribute) {
            return [];
        }

        return classAttribute.split(/\s+/g).filter(Boolean).map((nm) => {
            // The prefix is required to store "__proto__" in a object-based map.
            return "$" + nm;
        });
    };

    const idSelector = (idd: string): string => {
        return "#" + escapeIdentifierIfNeeded(idd);
    };

    const escapeIdentifierIfNeeded = (ident: string): string => {
        if (isCSSIdentifier(ident)) {
            return ident;
        }

        const shouldEscapeFirst = /^(?:[0-9]|-[0-9-]?)/.test(ident);
        const lastIndex = ident.length - 1;
        return ident.replace(/./g, (c: string, ii: number) => {
            return ((shouldEscapeFirst && ii === 0) || !isCSSIdentChar(c)) ? escapeAsciiChar(c, ii === lastIndex) : c;
        });
    };

    const escapeAsciiChar = (c: string, isLast: boolean) => {
        return "\\" + toHexByte(c) + (isLast ? "" : " ");
    };

    const toHexByte = (c: string): string => {
        let hexByte = c.charCodeAt(0).toString(16);
        if (hexByte.length === 1) {
            hexByte = "0" + hexByte;
        }
        return hexByte;
    };

    const isCSSIdentChar = (c: string): boolean => {
        if (/[a-zA-Z0-9_-]/.test(c)) {
            return true;
        }
        return c.charCodeAt(0) >= 0xA0;
    };

    const isCSSIdentifier = (value: string): boolean => {
        return /^-?[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value);
    };

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }
    const lowerCaseName = ((node as Element).localName && (node as Element).localName.toLowerCase())
        || node.nodeName.toLowerCase();

    const element = node as Element;

    const id = element.getAttribute("id");

    if (optimized) {
        if (id) {
            return {
                optimized: true,
                value: idSelector(id),
            };
        }
        if (lowerCaseName === "body" || lowerCaseName === "head" || lowerCaseName === "html") {
            return {
                optimized: true,
                value: lowerCaseName, // node.nodeNameInCorrectCase(),
            };
        }
    }

    const nodeName = lowerCaseName; // node.nodeNameInCorrectCase();
    if (id) {
        return {
            optimized: true,
            value: nodeName + idSelector(id),
        };
    }

    const parent = node.parentNode;

    if (!parent || parent.nodeType === Node.DOCUMENT_NODE) {
        return {
            optimized: true,
            value: nodeName,
        };
    }

    const prefixedOwnClassNamesArray_ = prefixedElementClassNames(element);
    const prefixedOwnClassNamesArray: string[] = []; // .keySet()
    prefixedOwnClassNamesArray_.forEach((arrItem) => {
        if (prefixedOwnClassNamesArray.indexOf(arrItem) < 0) {
            prefixedOwnClassNamesArray.push(arrItem);
        }
    });

    let needsClassNames = false;
    let needsNthChild = false;
    let ownIndex = -1;
    let elementIndex = -1;
    const siblings = (parent as Element).children;

    for (let i = 0; (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
        const sibling = siblings[i];
        if (sibling.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }
        elementIndex += 1;
        if (sibling === node) {
            ownIndex = elementIndex;
            continue;
        }
        if (needsNthChild) {
            continue;
        }

        // sibling.nodeNameInCorrectCase()
        const siblingName = (sibling.localName && sibling.localName.toLowerCase()) || sibling.nodeName.toLowerCase();
        if (siblingName !== nodeName) {
            continue;
        }
        needsClassNames = true;

        const ownClassNames: string[] = [];
        prefixedOwnClassNamesArray.forEach((arrItem) => {
            ownClassNames.push(arrItem);
        });
        let ownClassNameCount = ownClassNames.length;

        if (ownClassNameCount === 0) {
            needsNthChild = true;
            continue;
        }
        const siblingClassNamesArray_ = prefixedElementClassNames(sibling);
        const siblingClassNamesArray: string[] = []; // .keySet()
        siblingClassNamesArray_.forEach((arrItem) => {
            if (siblingClassNamesArray.indexOf(arrItem) < 0) {
                siblingClassNamesArray.push(arrItem);
            }
        });

        for (const siblingClass of siblingClassNamesArray) {
            const ind = ownClassNames.indexOf(siblingClass);
            if (ind < 0) {
                continue;
            }

            ownClassNames.splice(ind, 1); // delete ownClassNames[siblingClass];

            if (!--ownClassNameCount) {
                needsNthChild = true;
                break;
            }
        }
    }

    let result = nodeName;
    if (isTargetNode &&
        nodeName === "input" &&
        element.getAttribute("type") &&
        !element.getAttribute("id") &&
        !element.getAttribute("class")) {
        result += "[type=\"" + element.getAttribute("type") + "\"]";
    }
    if (needsNthChild) {
        result += ":nth-child(" + (ownIndex + 1) + ")";
    } else if (needsClassNames) {
        for (const prefixedName of prefixedOwnClassNamesArray) {
            result += "." + escapeIdentifierIfNeeded(prefixedName.substr(1));
        }
    }

    return {
        optimized: false,
        value: result,
    };
};

// tslint:disable-next-line:max-line-length
// https://chromium.googlesource.com/chromium/blink/+/master/Source/devtools/front_end/components/DOMPresentationUtils.js#270
// const simpleSelector = (node: Node): string => {
//     const lowerCaseName = (node.localName && node.localName.toLowerCase()) || node.nodeName.toLowerCase();
//     if (node.nodeType !== Node.ELEMENT_NODE) {
//         return lowerCaseName;
//     }

//     const element = node as Element;

//     const id = element.getAttribute("id");
//     if (id) {
//         return lowerCaseName + "#" + id;
//     }

//     const clazz = element.getAttribute("class");
//     if (clazz) {
//         return (lowerCaseName === "div" ? "" : lowerCaseName) + "." + clazz.trim().replace(/\s+/g, ".");
//     }

//     const typez = element.getAttribute("type");
//     if (typez && lowerCaseName === "input") {
//         return lowerCaseName + "[type=\"" + typez + "\"]";
//     }

//     return lowerCaseName;
// };
