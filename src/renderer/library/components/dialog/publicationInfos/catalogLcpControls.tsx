// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect, useDispatch } from "react-redux";
import { lcpActions, readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as LoopIcon from "readium-desktop/renderer/assets/icons/loop.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
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
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import DeletePublicationConfirm from "../DeletePublicationConfirm";
import * as SaveAsIcon from "readium-desktop/renderer/assets/icons/SaveAs-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as ReadBook from "readium-desktop/renderer/assets/icons/readBook-icon.svg";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
    isReading?: boolean;
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
                        <SVG svg={ReadBook} ariaHidden />
                        {__("catalog.readBook")}
                    </button>
                    : <></>
                }
                <button disabled>
                    <SVG ariaHidden svg={DoubleCheckIcon} />
                    {__("publication.markAsRead")}
                </button>
                {
                    // lsdStatus === StatusEnum.Expired &&
                    lsdRenewLink ?
                        <RenewLsdConfirm publicationView={this.props.publicationView} trigger={(
                            <button
                                className={stylesButtons.button_secondary}
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
                                className={stylesButtons.button_secondary}
                            >
                                <SVG svg={ArrowIcon} ariaHidden />
                                {__("publication.returnButton")}
                            </button>
                        )} /> : <></>
                }
                <DeletePublicationConfirm
                    trigger={(
                        <button className={stylesButtons.button_secondary}>
                            <SVG svg={TrashIcon} ariaHidden />
                            {__("catalog.deleteBook")}
                        </button>

                    )}
                    publicationView={this.props.publicationView}
                />

                <button onClick={this.exportPublication} className={stylesButtons.button_secondary}>
                    <SVG svg={SaveAsIcon} ariaHidden />
                    {__("catalog.export")}
                </button>
            </>
        );
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
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogLcpControls));

const RenewLsdConfirm = (props: { publicationView: PublicationView, trigger: React.ReactNode } & AlertDialog.AlertDialogProps) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const renew = () => {
        dispatch(lcpActions.renewPublicationLicense.build(props.publicationView.identifier));
    };

    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.renew")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}> {/* replace with <p></p> */}
                        {props.publicationView.documentTitle}
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={renew} type="button">
                                <SVG ariaHidden svg={LoopIcon} />
                                {__("dialog.yes")}</button>
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

    return (
        <AlertDialog.Root {...props}>
            <AlertDialog.Trigger asChild>
                {props.trigger}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
                <div className={stylesAlertModals.AlertDialogOverlay}></div>
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.return")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.publicationView.documentTitle}
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={stylesButtons.button_primary_blue} onClick={renew} type="button">
                                <SVG ariaHidden svg={ArrowIcon} />
                                {__("dialog.yes")}</button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};
