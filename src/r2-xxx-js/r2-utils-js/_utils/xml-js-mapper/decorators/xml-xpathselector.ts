// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { getDefinition } from "../classes/object-definition";
import { IXPathSelectorItem, IXmlNamespaces } from "../types";

export function XmlXPathSelector(selector: string, namespaces?: IXmlNamespaces) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target: any, key: string): void => {
        const objectType = Reflect.getMetadata("design:type", target, key);

        // console.log(target.constructor);
        const objDef = getDefinition(target.constructor);
        // console.log(objDef);
        const property = objDef.getProperty(key);
        property.xpathSelector = selector;

        if (namespaces) {
            property.namespaces = namespaces;
        }
        // TOO EARLY! :( (ObjectDefinition not ready yet)
        // let atLeastOne = false;
        // const namespacesAll: IXmlNamespaces = {};
        // if (objDef.namespaces) {
        //     console.log("***************************************** XmlObject NS");
        //     console.log(objDef.namespaces);
        //     for (const prop in objDef.namespaces) {
        //         if (objDef.namespaces.hasOwnProperty(prop)) {
        //             namespacesAll[prop] = objDef.namespaces[prop];
        //             atLeastOne = true;
        //         }
        //     }
        // }
        // if (namespaces) {
        //     console.log("***************************************** PROP NS");
        //     console.log(namespaces);
        //     for (const prop in namespaces) {
        //         if (namespaces.hasOwnProperty(prop)) {
        //             namespacesAll[prop] = namespaces[prop];
        //             atLeastOne = true;
        //         }
        //     }
        // }
        // if (atLeastOne) { // Object.keys(namespacesAll).length)
        //     property.namespaces = namespacesAll;
        // }

        property.array = objectType === Array;
        property.set = objectType === Set;
        if (!property.array && !property.set && !property.objectType) {
            property.objectType = objectType;
        }

        // console.log("£££££££££ " + property.xpathSelector);
        if (property.xpathSelector.indexOf("|") < 0
            && property.xpathSelector.indexOf(">") < 0
            && property.xpathSelector.indexOf("*") < 0
            && property.xpathSelector.indexOf("||") < 0
            && property.xpathSelector.indexOf("[") < 0
            && property.xpathSelector.indexOf("]") < 0) {

            property.xpathSelectorParsed = [];
            const items = property.xpathSelector.split("/");
            for (const item of items) {
                if (!item.length) {
                    continue;
                }
                // console.log(item);
                const subitems = item.split(":");
                // console.log(subitems[0]);
                // if (subitems.length > 1) {
                //     console.log(subitems[1]);
                // }
                const isAttribute = item[0] === "@";
                const isText = item === "text()";
                const localName = subitems.length > 1 ?
                    subitems[1] :
                    (isAttribute ? subitems[0].substr(1) : subitems[0]);
                const namespacePrefix = subitems.length > 1 ?
                    (isAttribute ? subitems[0].substr(1) : subitems[0]) :
                    undefined;

                // likely nil at this stage, populated in XmlObject() using top-level NS URI map
                const namespaceUri = namespacePrefix ?
                    (namespaces ? namespaces[namespacePrefix] : undefined) :
                    undefined;

                const xItem: IXPathSelectorItem = {
                    isAttribute,
                    isText,
                    localName,
                    namespacePrefix,
                    namespaceUri,
                };
                // console.log(xItem);
                property.xpathSelectorParsed.push(xItem);
            }
        }
    };
}
