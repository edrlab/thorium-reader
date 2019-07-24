// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as PlusIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { withApi } from "readium-desktop/renderer/components/utils/api";
import { TranslatorProps, withTranslator } from "../utils/translator";

interface Props extends TranslatorProps {
    importFiles?: any;
}

export class PublicationAddButton extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);

        this.importFile = this.importFile.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <div className={ styles.addEpubButton }>
                <input
                    id="epubInput"
                    type="file"
                    aria-label={__("accessibility.importFile")}
                    onChange={ this.importFile }
                    multiple
                    accept=".lcpl, .epub"
                />
                <label htmlFor="epubInput">
                    <SVG svg={ PlusIcon } title={__("header.importTitle")}/>
                </label>
            </div>
        );
    }

    private importFile(event: any) {
        const files = event.target.files;
        const paths: string[] = [];

        for (const f of files) {
            paths.push(f.path);
        }
        this.props.importFiles({ paths });
    }
}

export default withTranslator(withApi(
    PublicationAddButton,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "import",
                callProp: "importFiles",
            },
        ],
    },
));
