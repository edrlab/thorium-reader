// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ICustomizationLink, ICustomizationManifest, ICustomizationManifestLinkPropertiesExtension } from "src/common/readium/customization/manifest";

export type TTheme = "system" | "dark" | "light";

export interface ICustomizationTheme {
    enable: boolean;
    logo?: string;
    color?: ICustomizationManifest["theme"]["color"];
    links?: Array<ICustomizationLink & { properties: ICustomizationManifestLinkPropertiesExtension }>;
    title?: string;
}

export interface ITheme {
    name: TTheme,
    customization: ICustomizationTheme
}
export const themesList: Array<TTheme> = ["system", "dark", "light"];
