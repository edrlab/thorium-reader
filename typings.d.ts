// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

declare module "*.json" {
    const value: any;
    export default value;
}

declare module "*.md" {
    const content: string;
    export default content;
}

declare module "*.png" {
    const content: string;
    export default content;
}

// declare module "*.css" {
//     interface IClassNames {
//         [className: string]: string
//     }
//     const classNames: IClassNames;
//     export = classNames;
// }

declare module "*.svg" {
    interface IProps {
        [propName: string]: any;
    }
    const props: IProps;
    export default props;
}

declare module "*.ttf" {
    const value: any;
    export default value;
}

declare const __TH__IS_DEV__: boolean;
declare const __TH__IS_PACKAGED__: boolean;
declare const __TH__SKIP_LCP_LSD__: boolean;
declare const __TH__IS_VSCODE_LAUNCH__: boolean;
declare const __TH__IS_CI__: boolean;
declare const __TH__CUSTOMIZATION_PROFILE_PRIVATE_KEY__: string;
// declare const __TH__CUSTOMIZATION_PROFILE_PUB_KEY__: string;

declare module "bindings";
declare module "debug/src/node";
declare module "debug/src/browser";
declare module "debug/src/common";
declare module "json-diff";
// declare module "slugify";
// declare module "css2json";
// declare module "json-markup";
// declare module "filehound";
// declare module "selfsigned";
declare module "cssesc";
declare module "css.escape";
// declare module "node-stream-zip";
// declare module "unzipper";

// declare module "@flatten-js/polygon-offset" {
//     import { type Polygon } from "@flatten-js/core";
//     export default function offset(poly: Polygon, offset: number): Polygon;
// }
