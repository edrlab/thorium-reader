// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/SaveAs-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

class PublicationExportButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <button
                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                onClick={this.onExport}
            >
                <SVG ariaHidden svg={SaveIcon} />
                <p>{ __("catalog.export")}</p>
            </button>
        );
    }

    private onExport = () => {
        const publicationView = this.props.publicationView;
        apiAction("publication/exportPublication", publicationView).catch((error) => {
            console.error("Error to fetch publication/exportPublication", error);
        });
    };
}

export default withTranslator(PublicationExportButton);
