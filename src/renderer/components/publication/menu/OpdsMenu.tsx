// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as importAction from "readium-desktop/common/redux/actions/import";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: OpdsPublicationView;
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

        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const { opdsPublicationView, __, buttonIsDisabled } = this.props;
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo }
                >
                    {__("opds.menu.aboutBook")}
                </button>
                { opdsPublicationView.isFree &&
                    <button role="menuitem"
                        onClick={ (e) => this.onAddToCatalogClick(e) }
                        disabled={buttonIsDisabled}
                    >
                        {__("catalog.addBookToLib")}
                    </button>
                }
                { opdsPublicationView.buyUrl &&
                    <a role="menuitem"
                        href={opdsPublicationView.buyUrl}
                    >
                        {__("opds.menu.goBuyBook")}
                    </a>
                }
                { opdsPublicationView.borrowUrl &&
                    <a role="menuitem"
                        href={opdsPublicationView.borrowUrl}
                    >
                        {__("opds.menu.goLoanBook")}
                    </a>
                }
                { opdsPublicationView.subscribeUrl &&
                    <a role="menuitem"
                        href={opdsPublicationView.subscribeUrl}
                    >
                        {__("opds.menu.goSubBook")}
                    </a>
                }
                { opdsPublicationView.hasSample &&
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
        this.props.verifyImport(downloadSample);
    }

    private displayPublicationInfo(e: TMouseEvent) {
        e.preventDefault();
        this.props.displayPublicationInfo();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.open("publication-info",
                {
                    opdsPublicationView: props.opdsPublicationView,
                    publicationIdentifier: undefined,
                },
            ));
        },
        verifyImport: (downloadSample: boolean) => {
            dispatch(importAction.verifyImport(
                {
                    opdsPublicationView: props.opdsPublicationView,
                    downloadSample,
                },
            ));
        },
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
        buttonIsDisabled: state.download.downloads.findIndex((pub) => pub.url === props.opdsPublicationView.url) > -1,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsMenu));
