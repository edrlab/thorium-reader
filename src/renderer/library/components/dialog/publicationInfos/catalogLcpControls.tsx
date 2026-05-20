// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";

import * as React from "react";
import { connect, useDispatch } from "react-redux";
import { lcpActions, readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as LoopIcon from "readium-desktop/renderer/assets/icons/loop.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { apiAction } from "readium-desktop/renderer/library/apiAction";

import { StatusEnum } from "@r2-lcp-js/parser/epub/lsd";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import DeletePublicationConfirm from "../DeletePublicationConfirm";
import * as SaveAsIcon from "readium-desktop/renderer/assets/icons/SaveAs-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as ReadBook from "readium-desktop/renderer/assets/icons/readBook-icon.svg";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { ThButtonPrimary, ThButtonSecondary } from "readium-desktop/renderer/common/components/Buttons";


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
                    <ThButtonPrimary
                        onClick={this.handleRead}
                        svg={ReadBook}
                        label={__("catalog.readBook")}
                    />
                    : <></>
                }
                {this.props.isReading ?
                <ThButtonSecondary
                    disabled
                    svg={DoubleCheckIcon}
                    label={__("publication.markAsRead")}
                />
                : <></>
                }
                {
                    // lsdStatus === StatusEnum.Expired &&
                    lsdRenewLink ?
                        <RenewLsdConfirm publicationView={this.props.publicationView} trigger={(
                            <ThButtonSecondary
                                svg={LoopIcon}
                                label={__("publication.renewButton")}
                            />
                        )} /> : <></>
                }
                {
                    lsdReturnLink ?
                        <ReturnLsdConfirm publicationView={this.props.publicationView} trigger={(
                            <ThButtonSecondary
                                svg={ArrowIcon}
                                label={__("publication.returnButton")}
                            />
                        )} /> : <></>
                }
                <DeletePublicationConfirm
                    trigger={(
                        <ThButtonSecondary
                            svg={TrashIcon}
                            label={__("catalog.deleteBook")}
                        />
                    )}
                    publicationView={this.props.publicationView}
                />

                <ThButtonSecondary
                    onClick={this.exportPublication}
                    svg={SaveAsIcon}
                    label={__("catalog.export")}
                />
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

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(CatalogLcpControls));

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
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.renew")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}> {/* replace with <p></p> */}
                        {props.publicationView.documentTitle}
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <ThButtonSecondary label={__("dialog.cancel")} />
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <ThButtonPrimary
                            onClick={renew}
                            type="button"
                            svg={LoopIcon}
                            label={__("dialog.yes")}
                            />
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
                <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                    <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.return")}</AlertDialog.Title>
                    <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                        {props.publicationView.documentTitle}
                    </AlertDialog.Description>
                    <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
                        <AlertDialog.Cancel asChild>
                            <ThButtonSecondary label={__("dialog.cancel")} />
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <ThButtonPrimary
                            onClick={renew}
                            type="button"
                            svg={ArrowIcon}
                            label={__("dialog.yes")}
                            />
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );

};
