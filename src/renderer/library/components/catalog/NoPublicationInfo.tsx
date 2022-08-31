// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { acceptedExtensionArray } from "readium-desktop/common/extension";
import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";

import { TranslatorProps, withTranslator } from "../../../common/components/hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

class NoPublicationInfo extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <div className={stylesBlocks.block_dashed}>
                    <p><strong>{__("catalog.noPublicationHelpL1")}</strong></p>
                    <p><strong>{__("catalog.noPublicationHelpL2")}</strong></p>
                    <p>{__("catalog.noPublicationHelpL3")}</p>
                    <p>{__("catalog.noPublicationHelpL4")}</p>
                    <p>
                    {
                        acceptedExtensionArray.map(
                            (ext, i) => <span key={`ext_${i}`}>
                                <strong>{
                                    ext
                                }</strong>
                                {i < acceptedExtensionArray.length - 1 ? " | " : ""}
                            </span>,
                        )
                    }
                    </p>
                </div>
            </>
        );
    }
}

export default withTranslator(NoPublicationInfo);
