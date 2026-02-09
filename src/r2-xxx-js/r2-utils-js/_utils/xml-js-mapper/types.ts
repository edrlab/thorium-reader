// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// export type XmlValuePrimitive = string | number | boolean | null;

// export interface IXmlValueObject {
//     [x: string]: XmlValue;
// }

// export interface IXmlValueArray extends Array<XmlValue> {
//     dummy?: boolean;
// }

// export type XmlValue = XmlValuePrimitive | IXmlValueObject | IXmlValueArray;

export interface IXPathSelectorItem {
    isAttribute: boolean;
    isText: boolean;
    localName: string;
    namespacePrefix: string | undefined;
    namespaceUri: string | undefined;
}

export interface IParameterlessConstructor<T> {
    name?: string;
    new (): T;
}

export interface IDynamicObject {
    constructor: FunctionType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [name: string]: any;
}

export interface IParseOptions {
    runConstructor?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionType = any;

export interface IXmlNamespaces {
    [ns: string]: string; // local name => namespace URI
}
