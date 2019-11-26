// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { importActions } from "readium-desktop/common/redux/actions/";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: IOpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

export class OpdsMenu extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

    }

    public render(): React.ReactElement<{}> {
        const { opdsPublicationView, __, buttonIsDisabled } = this.props;
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo}
                >
                    {__("opds.menu.aboutBook")}
                </button>
                {
                    (Array.isArray(opdsPublicationView.sampleOrPreviewLinks)
                        || Array.isArray(opdsPublicationView.openAccessLinks))
                    &&
                    <button role="menuitem"
                        onClick={(e) => this.onAddToCatalogClick(e)}
                        disabled={buttonIsDisabled()}
                    >
                        {
                            Array.isArray(opdsPublicationView.openAccessLinks) ?
                                __("catalog.addBookToLib") :
                                __("opds.menu.addExtract")
                        }
                    </button>
                }
                {
                    Array.isArray(opdsPublicationView.buyLinks)
                    && opdsPublicationView.buyLinks[0]
                    &&
                    <a role="menuitem"
                        href={opdsPublicationView.buyLinks[0].url}
                    >
                        {__("opds.menu.goBuyBook")}
                    </a>
                }
                {
                    Array.isArray(opdsPublicationView.borrowLinks)
                    && opdsPublicationView.borrowLinks[0]
                    &&
                    <a role="menuitem"
                        href={opdsPublicationView.borrowLinks[0].url}
                    >
                        {__("opds.menu.goLoanBook")}
                    </a>
                }
                {
                    Array.isArray(opdsPublicationView.subscribeLinks)
                    && opdsPublicationView.subscribeLinks[0]
                    &&
                    <a role="menuitem"
                        href={opdsPublicationView.subscribeLinks[0].url}
                    >
                        {__("opds.menu.goSubBook")}
                    </a>
                }
            </>
        );
    }

    private onAddToCatalogClick = (e: TMouseEvent) => {
        e.preventDefault();
        this.props.verifyImport();
    }

    private displayPublicationInfo = (e: TMouseEvent) => {
        e.preventDefault();
        this.props.displayPublicationInfo();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build("publication-info-opds",
                {
                    publication: props.opdsPublicationView,
                },
            ));
        },
        verifyImport: () => {
            dispatch(importActions.verify.build(props.opdsPublicationView));
        },
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
        buttonIsDisabled: () => {
            const foundDownload = state.download.downloads.find((dl) => {
                return dl.url === props.opdsPublicationView.openAccessLinks[0]?.url ||
                    dl.url === props.opdsPublicationView.sampleOrPreviewLinks[0]?.url;
            });
            return foundDownload ? true : false;
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsMenu));
