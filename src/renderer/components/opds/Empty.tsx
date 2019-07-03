// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

export class Empty extends React.Component<TranslatorProps> {
    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <div>
                <p>{ __("opds.empty")}</p>
            </div>
        );
    }
}

export default withTranslator(Empty);
