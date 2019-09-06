// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

class NoPublicationInfo extends React.Component<TranslatorProps> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <div className={styles.noPublicationHelp}>
                    <p>{__("catalog.noPublicationHelpL1")}</p>
                    <p>{__("catalog.noPublicationHelpL2")}</p>
                    { /*<p>{__("catalog.noPublicationHelpL3")}</p> */ }
                </div>
            </>
        );
    }
}

export default withTranslator(NoPublicationInfo);
