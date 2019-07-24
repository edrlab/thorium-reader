// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { PublicationView } from "readium-desktop/common/views/publication";

import { withApi } from "readium-desktop/renderer/components/utils/api";
import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

interface PublicationCardProps extends TranslatorProps {
    publication: PublicationView;
    exportPublication?: (data: any) => void;
    onClick: () => void;
}

class PublicationExportButton extends React.Component<PublicationCardProps> {
    private exportInputRef: any;

    constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        };
        this.exportInputRef = React.createRef();
    }

    public componentDidMount() {
        this.exportInputRef.current.directory = true;
        this.exportInputRef.current.webkitdirectory = true;
    }

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        const id = "exportInput" + this.props.publication.identifier;
        return (
                <span>
                    <input
                        id={ id }
                        ref={ this.exportInputRef }
                        type="file"
                        multiple
                        onChange={ this.onExport }
                    />
                    <label htmlFor={ id }>
                        { __("catalog.export")}
                    </label>
                </span>
        );
    }

    private onExport = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.props.onClick();
        const destinationPath = event.target.files[0].path;
        const publication = this.props.publication;
        this.props.exportPublication({ destinationPath, publication });
    }
}

export default withApi(
    PublicationExportButton,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "exportPublication",
                callProp: "exportPublication",
            },
        ],
    },
);
