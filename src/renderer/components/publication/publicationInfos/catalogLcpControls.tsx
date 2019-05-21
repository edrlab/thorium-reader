// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as LoopIcon from "readium-desktop/renderer/assets/icons/loop.svg";

import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import { PublicationView } from "readium-desktop/common/views/publication";

import { DialogType } from "readium-desktop/common/models/dialog";
import { LsdStatus, LsdStatusType } from "readium-desktop/common/models/lcp";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface CatalogLcpControlsProps extends TranslatorProps {
    publication: PublicationView;
    openReader?: any;
    openDeleteDialog?: any;
    openReturnDialog?: any;
    openRenewDialog?: any;
    lsdStatus?: LsdStatus;
}

export class CatalogLcpControls extends React.Component<CatalogLcpControlsProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, publication, lsdStatus } = this.props;

        if (!publication) {
            return (<></>);
        }

        console.log(lsdStatus);

        return (
            <>
                { lsdStatus && (lsdStatus.status === LsdStatusType.Active ?
                    <a  onClick={this.handleRead} className={styles.lire}>{__("publication.readButton")}</a>
                : lsdStatus.status === LsdStatusType.Expired ?
                    <p style={{color: "red"}}>{__("publication.expiredLcp")}</p>
                : lsdStatus.status === LsdStatusType.Revoked ?
                    <p style={{color: "red"}}>{__("publication.revokedLcp")}</p>
                : <p style={{color: "red"}}>{__("publication.returnedLcp")}</p>)}
                <ul className={styles.liens}>
                    { lsdStatus && lsdStatus.status === LsdStatusType.Expired &&
                        <li>
                            <a onClick={ this.props.openRenewDialog }>
                                <SVG svg={LoopIcon} />
                                {__("publication.renewButton")}
                            </a>
                        </li>
                    }
                    <li>
                        <a onClick={ this.props.openReturnDialog }>
                            <SVG svg={ArrowIcon} />
                            {__("publication.returnButton")}
                        </a>
                    </li>
                    <li>
                        <a onClick={ this.deletePublication }>
                            <SVG svg={DeleteIcon} />
                            {__("publication.deleteButton")}
                        </a>
                    </li>
                </ul>
            </>
        );
    }

    private deletePublication(e: any) {
        e.preventDefault();
        this.props.openDeleteDialog(this.props.publication);
    }

    private handleRead(e: any) {
        e.preventDefault();

        this.props.openReader(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, props: CatalogLcpControlsProps) => {
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
        openDeleteDialog: (publication: string) => {
            dispatch(dialogActions.open(
                DialogType.DeletePublicationConfirm,
                {
                    publication,
                },
            ));
        },
        openRenewDialog: () => {
            dispatch(dialogActions.open(
                DialogType.LsdRenewConfirm,
                {
                    publication: props.publication,
                },
            ));
        },
        openReturnDialog: () => {
            dispatch(dialogActions.open(
                DialogType.LsdReturnConfirm,
                {
                    publication: props.publication,
                },
            ));
        },
    };
};

const buildRequestData = (props: CatalogLcpControlsProps) => {
    return { publication: props.publication };
};

export default withApi(
    withTranslator(CatalogLcpControls),
    {
        mapDispatchToProps,
        operations: [
            {
                moduleId: "lcp",
                methodId: "getLsdStatus",
                resultProp: "lsdStatus",
                buildRequestData,
                onLoad: true,
            },
        ],
    },
);
