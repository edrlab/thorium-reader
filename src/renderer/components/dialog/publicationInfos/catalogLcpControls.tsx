// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { LsdStatus, LsdStatusType } from "readium-desktop/common/models/lcp";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as LoopIcon from "readium-desktop/renderer/assets/icons/loop.svg";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps {
    publication: PublicationView;
}

interface IState {
    lsdStatus: LsdStatus | undefined;
}

class CatalogLcpControls extends React.Component<IProps & ReturnType<typeof mapDispatchToProps>, IState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            lsdStatus: undefined,
        };

        this.handleRead = this.handleRead.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
    }

    public componentDidMount() {
        // don't forget to handle httpRequest in frontend
        apiAction("lcp/getLsdStatus", {publication: this.props.publication})
        .then((request) => this.setState({lsdStatus: request.data}))
        .catch((error) => {
            console.error(`Error to fetch lcp/getLsdStatus`, error);
        });
    }

    public render(): React.ReactElement<{}> {
        const { __, publication } = this.props;
        const { lsdStatus } = this.state;

        if (!publication) {
            return (<></>);
        }

        return (
            <>
                { lsdStatus && (lsdStatus.status === LsdStatusType.Active ?
                    <button  onClick={this.handleRead} className={styles.lire}>{__("publication.readButton")}</button>
                : lsdStatus.status === LsdStatusType.Expired ?
                    <p style={{color: "red"}}>{__("publication.expiredLcp")}</p>
                : lsdStatus.status === LsdStatusType.Revoked ?
                    <p style={{color: "red"}}>{__("publication.revokedLcp")}</p>
                : <p style={{color: "red"}}>{__("publication.returnedLcp")}</p>)}
                <ul className={styles.liens}>
                    { lsdStatus && lsdStatus.status === LsdStatusType.Expired &&
                        <li>
                            <button onClick={ this.props.openRenewDialog }>
                                <SVG svg={LoopIcon} ariaHidden/>
                                {__("publication.renewButton")}
                            </button>
                        </li>
                    }
                    <li>
                        <button onClick={ this.props.openReturnDialog }>
                            <SVG svg={ArrowIcon} ariaHidden/>
                            {__("publication.returnButton")}
                        </button>
                    </li>
                    <li>
                        <button onClick={ this.deletePublication }>
                            <SVG svg={DeleteIcon} ariaHidden/>
                            {__("publication.deleteButton")}
                        </button>
                    </li>
                </ul>
            </>
        );
    }

    private deletePublication(e: TMouseEvent) {
        e.preventDefault();
        this.props.openDeleteDialog(this.props.publication);
    }

    private handleRead(e: TMouseEvent) {
        e.preventDefault();

        this.props.openReader(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IProps) => {
    return {
        openReader: (publication: PublicationView) => {
            dispatch({
                type: readerActions.ActionType.OpenRequest,
                payload: {
                    publication: {
                        identifier: publication.identifier,
                    },
                },
            });
        },
        openDeleteDialog: (publication: PublicationView) => {
            dispatch(dialogActions.open("delete-publication-confirm",
                {
                    publication,
                },
            ));
        },
        openRenewDialog: () => {
            dispatch(dialogActions.open("lsd-renew-confirm",
                {
                    publication: props.publication,
                },
            ));
        },
        openReturnDialog: () => {
            dispatch(dialogActions.open("lsd-return-confirm",
                {
                    publication: props.publication,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogLcpControls));
