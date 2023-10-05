// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IBreadCrumbItem } from "readium-desktop/common/redux/states/renderer/breadcrumbItem";

export interface IOpdsSearchState {
    url?: string;
    level?: number;
}

export interface IOpdsHeaderState {
    start?: string;
    bookshelf?: string;
    self?: string;
    up?: string;
}

export interface IOpdsBrowserState {
    breadcrumb: IBreadCrumbItem[];
    headerUrl: IOpdsHeaderState;
}

export interface OpdsState {
    browser: IOpdsBrowserState;
}
