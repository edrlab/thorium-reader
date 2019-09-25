// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TChangeEvent } from "readium-desktop/typings/react";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";

export class PublicationAddButton extends React.Component<TranslatorProps> {
    public constructor(props: TranslatorProps) {
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
                    accept=".epub, .epub3"
                />
                <label htmlFor="epubInput">
                    <SVG svg={ PlusIcon } title={__("header.importTitle")}/>
                </label>
            </div>
        );
    }

    private importFile(event: TChangeEvent) {
        const files = event.target.files;
        const paths: string[] = [];

        for (const f of files) {
            paths.push(f.path);
        }
        apiFetch("publication/import", paths).catch((error) => {
            console.error(`Error to fetch publication/import`, error);
        });
    }
}

export default withTranslator(PublicationAddButton);
/*withTranslator(withApi(
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
));*/
