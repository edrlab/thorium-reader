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
        [propName: string]: any
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
