// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter } from "../converters/converter";
import { FunctionType, IXPathSelectorItem, IXmlNamespaces } from "../types";

export class PropertyDefinition {
    public objectType: FunctionType | undefined;
    public array = false;
    public set = false;
    public readonly = false;
    public writeonly = false;
    public converter: IPropertyConverter | undefined;
    public xpathSelector: string | undefined;
    public xpathSelectorParsed: IXPathSelectorItem[] | undefined;
    public namespaces: IXmlNamespaces | undefined;
}
