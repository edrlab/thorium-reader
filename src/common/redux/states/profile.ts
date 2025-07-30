// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface IPalette {
    "neutral": string;
    "primary": string;
    "secondary": string;
    "border": string;
    "background": string;
    "app_name": string;
}

interface INavigation {
    title: string;
    href: string;
    type: string;
    rel: string;
    properties?: {
        show_on_homepage: boolean;
        authenticate_on_launch: boolean;
        authenticate: {
            href: string;
            type: string;
        }
    }
}

interface IPublication {
    href: string;
    type: string;
}

interface ILinks {
    title: string;
    href: string;
    type: string;
    rel: string;
 }

export interface IProfile {
    id: number,
    manifest_version: number;
    version: string,
    name: string,
    language?: string,
    splash_screen?: string,
    theme?: {light: IPalette, dark: IPalette};
    show_apiapp: boolean;
    show_catalogs: boolean;
    images?: {href: string, type: string, rel: string, alt: string}[],
    navigation: INavigation[];
    publications?: IPublication[];
    links?: ILinks[];
    signature?: {key: string, value: string, algorithm: string}
}
