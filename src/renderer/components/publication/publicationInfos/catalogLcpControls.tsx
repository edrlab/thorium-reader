// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { DialogType } from "readium-desktop/common/models/dialog";
import { LsdStatus, LsdStatusType } from "readium-desktop/common/models/lcp";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as LoopIcon from "readium-desktop/renderer/assets/icons/loop.svg";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import { withApi } from "readium-desktop/renderer/components/utils/hoc/api";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";

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
    return [ props.publication ];
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
