// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

interface ILink {
  title: string;
  href: string;
  type: string;
  rel: string;
  properties?: {
    showOnHomepage?: boolean;
    allowDeletion?: boolean;
    authenticate?: {
      href: string;
      type: string;
    };
    logo?: {
      href: string;
      type: string;
    };
  };
}

export interface IProfile {
    id: number,
    name: string,
    links?: ILink[],
    colors?: {
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
    };
    dilicom: boolean,
}
