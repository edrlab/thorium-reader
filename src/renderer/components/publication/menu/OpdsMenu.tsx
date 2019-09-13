// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as importAction from "readium-desktop/common/redux/actions/import";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication: OpdsPublicationView;
}

export class PublicationCard extends React.Component<IProps> {
    public constructor(props: IProps) {
        super(props);

        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const { publication, __ } = this.props;
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo }
                >
                    {__("opds.menu.aboutBook")}
                </button>
                { publication.isFree &&
                    <button role="menuitem"
                        onClick={ (e) => this.onAddToCatalogClick(e) }
                    >
                        {__("catalog.addBookToLib")}
                    </button>
                }
                { publication.buyUrl &&
                    <a role="menuitem"
                        href={publication.buyUrl}
                    >
                        {__("opds.menu.goBuyBook")}
                    </a>
                }
                { publication.borrowUrl &&
                    <a role="menuitem"
                        href={publication.borrowUrl}
                    >
                        {__("opds.menu.goLoanBook")}
                    </a>
                }
                { publication.subscribeUrl &&
                    <a role="menuitem"
                        href={publication.subscribeUrl}
                    >
                        {__("opds.menu.goSubBook")}
                    </a>
                }
                { publication.hasSample &&
                    <button role="menuitem"
                        onClick={ (e) => this.onAddToCatalogClick(e, true) }
                    >
                        {__("opds.menu.addExtract")}
                    </button>
                }
            </>
        );
    }

    private onAddToCatalogClick(e: TMouseEvent, downloadSample?: boolean) {
        e.preventDefault();
        this.props.verifyImport(this.props.publication, downloadSample);
    }

    private displayPublicationInfo(e: TMouseEvent) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        displayPublicationInfo: (publication: OpdsPublicationView) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfo,
                {
                    publication,
                    isOpds: true,
                },
            ));
        },
        verifyImport: (publication: OpdsPublicationView, downloadSample: boolean) => {
            dispatch(importAction.verifyImport(
                {
                    publication,
                    downloadSample,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationCard));
