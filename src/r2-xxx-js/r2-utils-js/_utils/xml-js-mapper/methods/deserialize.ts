// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as xpath from "xpath";

import {
    ObjectDefinition, getTypedInheritanceChain, objectDefinitions,
} from "../classes/object-definition";
import { PropertyDefinition } from "../classes/property-definition";
import { propertyConverters } from "../converters/converter";
import { FunctionType, IDynamicObject, IParseOptions } from "../types";

export function deserialize(
    objectInstance: Node,
    objectType: FunctionType | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: IParseOptions = { runConstructor: false }): any {

    // if (objectInstance && objectInstance.constructor === Array) {
    //     return (objectInstance as IXmlValueArray).map((o) => deserializeRootObject(o, objectType, options));
    // }

    return deserializeRootObject(objectInstance, objectType, options);
}

function deserializeRootObject(
    objectInstance: Node,
    objectType: FunctionType = Object,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: IParseOptions): any {

    // // tslint:disable-next-line:no-string-literal
    // const debug = process.env["OPF_PARSE"] === "true";

    if (!objectDefinitions.has(objectType)) {
        return undefined;
    }

    const [objectType2, ...superTypes] = getTypedInheritanceChain(objectType, objectInstance);

    const output = Object.create(objectType2.prototype);

    const definitions = [...superTypes.reverse(), objectType2]
        .map((t) => objectDefinitions.get(t))
        .filter((t) => !!t) as ObjectDefinition[];

    definitions.forEach((d) => {
        if (!d) {
            return;
        }

        if (options.runConstructor) {
            d.ctr.call(output);
        }

        d.beforeDeserialized.call(output);

        // if (debug) {
        //     console.log("======== PROPS: " + objectInstance.localName);
        // }

        d.properties.forEach((p, key) => {
            if (!p.objectType) {
                throw new Error(`Cannot deserialize property "${key}" without type!`);
            }

            if (p.readonly) {
                return;
            }

            // const namespaces: IXmlNamespaces = {};
            // if (d.namespaces) {
            //     for (const prop in d.namespaces) {
            //         if (d.namespaces.hasOwnProperty(prop)) {
            //             namespaces[prop] = d.namespaces[prop];
            //         }
            //     }
            // }
            // if (p.namespaces) {
            //     for (const prop in p.namespaces) {
            //         if (p.namespaces.hasOwnProperty(prop)) {
            //             namespaces[prop] = p.namespaces[prop];
            //         }
            //     }
            // }

            // if (debug) {
            //     console.log(`${p.xpathSelector}`);
            // }

            if (p.xpathSelectorParsed) {

                const xpathMatched: Node[] = [];

                let currentNodes = [objectInstance];

                let index = -1;
                for (const item of p.xpathSelectorParsed) {
                    index++;

                    const nextCurrentNodes: Node[] = [];

                    for (const currentNode of currentNodes) {

                        if (item.isText) {
                            let textNode = currentNode.firstChild || currentNode; // fallback
                            if (currentNode.childNodes && currentNode.childNodes.length) {
                                const allTextNodes: Node[] = [];
                                let atLeastOneElementChild = false;
                                for (let i = 0; i < currentNode.childNodes.length; i++) {
                                    const childNode = currentNode.childNodes.item(i);
                                    if (childNode.nodeType === 3) { // TEXT_NODE
                                        allTextNodes.push(childNode);
                                        // textNode = childNode;
                                        // break;
                                    } else if (childNode.nodeType === 1) { // ELEMENT_NODE
                                        atLeastOneElementChild = true;
                                        break;
                                    }
                                }
                                if (atLeastOneElementChild) {
                                    // console.log("###################");
                                    // console.log("###################");
                                    // console.log("###################");

                                    let toStringed: string | undefined;
                                    if ((currentNode as Element).innerHTML) {
                                        console.log("innerHTML");
                                        toStringed = (currentNode as Element).innerHTML;
                                    } else if (currentNode.childNodes.toString) {
                                        // console.log("childNodes.toString");
                                        toStringed = currentNode.childNodes.toString();
                                    } else {
                                        console.log("childNodes.items.toString?");
                                        for (let i = 0; i < currentNode.childNodes.length; i++) {
                                            const childNode = currentNode.childNodes.item(i);
                                            if (childNode.toString) {
                                                if (!toStringed) {
                                                    toStringed = "";
                                                }
                                                toStringed += childNode.toString();
                                            }
                                        }
                                    }

                                    if (toStringed) {
                                        // console.log(toStringed);

                                        // textNode = document.createTextNode(toStringed);
                                        // console.log(textNode.nodeType);
                                        // console.log((textNode as Text).data);

                                        const obj = { data: toStringed, nodeType: 3 };
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore:next-line
                                        textNode = obj;

                                        // textNode = new Node();
                                        // (textNode as any).nodeType = 3;
                                        // (textNode as Text).data = toStringed;
                                    }
                                } else if (allTextNodes.length) {
                                    if (allTextNodes.length === 1) {
                                        textNode = allTextNodes[0];
                                    } else {
                                        console.log("###################");
                                        console.log("###################");
                                        console.log("###################");

                                        console.log("XML text nodes: [" + allTextNodes.length + "]");

                                        let fullTxt = "";
                                        allTextNodes.forEach((allTextNode) => {
                                            fullTxt += (allTextNode as Text).data;
                                        });

                                        console.log(fullTxt);

                                        // textNode = document.createTextNode(fullTxt);
                                        // console.log(textNode.nodeType);
                                        // console.log((textNode as Text).data);

                                        const obj = { data: fullTxt, nodeType: 3 };
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore:next-line
                                        textNode = obj;

                                        // textNode = new Node();
                                        // (textNode as any).nodeType = 3;
                                        // (textNode as Text).data = fullTxt;
                                    }
                                }
                            }
                            if (textNode) {
                                xpathMatched.push(textNode);
                            }
                        } else if (item.isAttribute) {
                            if ((currentNode as Element).attributes) {

                                const attr = item.namespaceUri ?
                                    (currentNode as Element).attributes.getNamedItemNS(
                                        item.namespaceUri, item.localName) :
                                    (currentNode as Element).attributes.getNamedItem(item.localName);

                                if (attr) {
                                    xpathMatched.push(attr);
                                }
                            }
                        } else {
                            if (currentNode.childNodes && currentNode.childNodes.length) {
                                for (let i = 0; i < currentNode.childNodes.length; i++) {
                                    const childNode = currentNode.childNodes.item(i);
                                    if (childNode.nodeType !== 1) { // ELEMENT_NODE
                                        continue;
                                    }
                                    if ((childNode as Element).localName !== item.localName) {
                                        continue;
                                    }
                                    if (item.namespaceUri &&
                                        item.namespaceUri !== (childNode as Element).namespaceURI) {
                                        continue;
                                    }

                                    nextCurrentNodes.push(childNode);
                                }
                            }
                        }
                    }

                    currentNodes = nextCurrentNodes;

                    if (index === p.xpathSelectorParsed.length - 1) {
                        currentNodes.forEach((node) => {
                            xpathMatched.push(node);
                        });
                    }
                }

                // // CHECKING ...
                // const select = xpath.useNamespaces(p.namespaces || {});
                // const xPathSelected = select(p.xpathSelector, objectInstance);
                // if (xPathSelected && xPathSelected.length) {
                //     const xpathMatchedCheck: Node[] = [];
                //     if (!(xPathSelected instanceof Array)) {
                //         xpathMatchedCheck.push(xPathSelected);
                //     } else {
                //         xPathSelected.forEach((item: Node) => {
                //             // console.log(item.nodeValue || item.localName);
                //             xpathMatchedCheck.push(item);
                //         });
                //     }
                //     if (!xpathMatched || !xpathMatched.length) {
                //         console.log("########################## XPATH NO MATCH 1 !!!!!!");
                //         console.log(p.xpathSelector);
                //     } else if (xpathMatchedCheck.length !== xpathMatched.length) {
                //         console.log("########################## XPATH NO MATCH 2 !!!!!!");
                //     } else {
                //         xpathMatchedCheck.forEach((item: Node, index: number) => {
                //             if (item !== xpathMatched[index]) {
                //                 console.log("########################## XPATH NO MATCH 3 !!!!!!");
                //             }
                //         });
                //     }
                // } else {
                //     if (xpathMatched && xpathMatched.length) {
                //         console.log("########################## XPATH NO MATCH 4 !!!!!!");
                //     }
                // }

                if (xpathMatched && xpathMatched.length) {

                    if (p.array || p.set) {
                        output[key] = []; // Array<IDynamicObject>();
                        xpathMatched.forEach((item) => {
                            output[key].push(deserializeObject(item, p, options));
                        });

                        if (p.set) {
                            output[key] = new Set(output[key]);
                        }
                        return;
                    }

                    output[key] = deserializeObject(xpathMatched[0], p, options);
                }
            } else if (p.xpathSelector) {
                // console.log("########### USING XPATH!");
                // console.log(`${p.xpathSelector}`);

                // const timeBegin = process.hrtime();
                // console.log(namespaces);
                // console.log(p.xpathSelector);
                const select = xpath.useNamespaces(p.namespaces || {});
                const xPathSelected = select(p.xpathSelector, objectInstance) as Node[];

                if (xPathSelected && xPathSelected.length) {

                    // const timeElapsed = process.hrtime(timeBegin);
                    // if (debug) {
                    //     console.log(`=-------- ${timeElapsed[0]} seconds + ${timeElapsed[1]} nanoseconds`);
                    // }
                    // if (timeElapsed[0] > 1) {
                    //     process.exit(1);
                    // }

                    const xpathMatched: Node[] = [];

                    // console.log("XPATH MATCH: " + p.xpathSelector
                    //     + " == " + (xPathSelected instanceof Array)
                    //     + " -- " + xPathSelected.length);

                    if (!(xPathSelected instanceof Array)) {
                        xpathMatched.push(xPathSelected);
                    } else {
                        xPathSelected.forEach((item: Node) => {
                            // console.log(item.nodeValue || item.localName);
                            xpathMatched.push(item);
                        });
                    }

                    if (p.array || p.set) {
                        output[key] = []; // Array<IDynamicObject>();
                        xpathMatched.forEach((item) => {
                            output[key].push(deserializeObject(item, p, options));
                        });

                        if (p.set) {
                            output[key] = new Set(output[key]);
                        }
                        return;
                    }

                    output[key] = deserializeObject(xpathMatched[0], p, options);
                }
            }
        });

        d.onDeserialized.call(output);
    });

    return output;
}

function deserializeObject(
    objectInstance: Node,
    definition: PropertyDefinition,
    _options: IParseOptions): IDynamicObject {

    const primitive = definition.objectType === String
        || definition.objectType === Boolean
        || definition.objectType === Number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any =
        // objectInstance.nodeValue;
        objectInstance.nodeType === 3 ? // TEXT_NODE
            (objectInstance as Text).data :
            (objectInstance.nodeType === 2 ? // ATTRIBUTE_NODE
                (objectInstance as Attr).value :
                (objectInstance.nodeType === 1 ? // ELEMENT_NODE
                    (objectInstance as Element).localName :
                    objectInstance.nodeValue));

    const converter = definition.converter || propertyConverters.get(definition.objectType);
    if (converter) {
        return converter.deserialize(value);
    }

    if (!primitive) {
        const objDefinition = objectDefinitions.get(definition.objectType);

        if (objDefinition) {
            return deserialize(objectInstance, definition.objectType);
        }
    }

    return value;
}
