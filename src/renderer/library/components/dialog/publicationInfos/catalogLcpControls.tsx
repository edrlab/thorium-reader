// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect, useDispatch } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { lcpActions, readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as ExportIcon from "readium-desktop/renderer/assets/icons/download.svg";
import * as LoopIcon from "readium-desktop/renderer/assets/icons/loop.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { apiAction } from "readium-desktop/renderer/library/apiAction";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.css";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

class CatalogLcpControls extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
        this.exportPublication = this.exportPublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, publicationView } = this.props;

        if (!publicationView) {
            return (<></>);
        }

        const lsdOkay = publicationView.lcp &&
            publicationView.lcp.lsd &&
            publicationView.lcp.lsd.lsdStatus;

        const lsdStatus = lsdOkay &&
            publicationView.lcp.lsd.lsdStatus.status ?
            publicationView.lcp.lsd.lsdStatus.status : undefined;

        const lsdReturnLink = (!lsdOkay || !publicationView.lcp.lsd.lsdStatus.links) ? undefined :
            publicationView.lcp.lsd.lsdStatus.links.find((link) => {
                return link.rel === "return";
            });

        const lsdRenewLink = (!lsdOkay || !publicationView.lcp.lsd.lsdStatus.links) ? undefined :
            publicationView.lcp.lsd.lsdStatus.links.find((link) => {
                return link.rel === "renew";
            });
        return (
            <>
                {(!lsdStatus ||
                (lsdStatus === StatusEnum.Active || lsdStatus === StatusEnum.Ready)) ?
                <button
                    onClick={this.handleRead}
                    className={stylesButtons.button_primary}
                >
                    {__("catalog.readBook")}
                </button>
                : <></>
                }
                {
                    // lsdStatus === StatusEnum.Expired &&
                    lsdRenewLink ?
                        <RenewLsdConfirm publicationView={this.props.publicationView} trigger={(
                            <button
                                className={stylesButtons.button_transparency}
                            >
                                <SVG svg={LoopIcon} ariaHidden />
                                {__("publication.renewButton")}
                            </button>
                        )} /> : <></>
                }
                {
                    lsdReturnLink ?
                        <ReturnLsdConfirm publicationView={this.props.publicationView} trigger={(
                            <button
                                className={stylesButtons.button_transparency}
                            >
                                <SVG svg={LoopIcon} ariaHidden />
                                {__("publication.returnButton")}
                            </button>
                        )} /> : <></>
                }
                <button
                    onClick={ this.deletePublication }
                    className={stylesButtons.button_transparency}
                >
                    <SVG svg={DeleteIcon} ariaHidden/>
                    {__("catalog.deleteBook")}
                </button>

                <button onClick={this.exportPublication} className={stylesButtons.button_transparency}>
                    <SVG svg={ExportIcon} ariaHidden />
                    {__("catalog.export")}
                </button>
            </>
        );
    }

    private deletePublication(e: TMouseEventOnButton) {
        e.preventDefault();
        this.props.openDeleteDialog();
    }
    private exportPublication(e: TMouseEventOnButton) {
        e.preventDefault();

        // this.props.exportPub();
        apiAction("publication/exportPublication", this.props.publicationView).catch((error) => {
            console.error("Error to fetch publication/exportPublication", error);
        });
    }

    private handleRead(e: TMouseEventOnButton) {
        e.preventDefault();

        this.props.openReader();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        openReader: () => {
            dispatch(dialogActions.closeRequest.build());
            dispatch(readerActions.openRequest.build(props.publicationView.identifier));
        },
        openDeleteDialog: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.DeletePublicationConfirm,
                {
                    publicationView: props.publicationView,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogLcpControls));

const RenewLsdConfirm = (props: { publicationView: PublicationView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const renew = () => {
            dispatch(lcpActions.renewPublicationLicense.build(props.publicationView.identifier));
    };

    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal container={appOverlayElement}>
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("publication.renewButton")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        <p><strong>{__("dialog.renew")}</strong></p>
                        <p>{props.publicationView.documentTitle}</p>
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.abort)}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.delete)} onClick={renew} type="button">{__("dialog.yes")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};

const ReturnLsdConfirm = (props: { publicationView: PublicationView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const renew = () => {
            dispatch(lcpActions.returnPublication.build(props.publicationView.identifier));
    };

    const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal container={appOverlayElement}>
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("publication.returnButton")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        <p><strong>{__("dialog.return")}</strong></p>
                        <p>{props.publicationView.documentTitle}</p>
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.abort)}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={classNames(stylesAlertModals.AlertDialogButton, stylesAlertModals.delete)} onClick={renew} type="button">{__("dialog.yes")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};
