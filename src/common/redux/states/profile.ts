// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

interface IPalette {
    "neutral-light": string;
    "neutral-dark": string;
    "primary-light": string;
    "primary-dark": string;
    "secondary-light": string;
    "secondary-dark": string;
    "border-light": string;
    "border-dark": string;
    "background-light": string;
    "background-dark": string;
    "appName-light": string;
    "appName-dark": string;
}

interface ILink {
    feeds?:
        {
            title: string;
            href: string;
            type: string;
            rel: string;
        }[];
    publications?:
        {
            title: string;
            href: string;
            type: string;
            rel: string;
        }[]
}

export interface IProfile {
    id: number,
    version: number,
    name: string,
    logo?: {href: string, type: string},
    language?: string,
    palette?: IPalette;
    properties?: {
        showOnHomepage?: boolean;
        allowDeletion?: boolean;
        apiapp: boolean;
        authenticate?: {
            href: string;
            type: string;
        };
    }
    links?: ILink
}
