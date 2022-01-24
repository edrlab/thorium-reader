// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { dialogActions, importActions } from "readium-desktop/common/redux/actions/";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as CartFillIcon from "readium-desktop/renderer/assets/icons/cart-fill.svg";
import * as ImportIcon from "readium-desktop/renderer/assets/icons/import.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { findExtWithMimeType, findMimeTypeWithExtension, MIME_TYPE_ADOBE_OBSOLETE_BORROWING_FORMAT } from "readium-desktop/utils/mimeTypes";

import OpdsLinkProperties from "./OpdsLinkProperties";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: IOpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

export class OpdsControls extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {

        if (!this.props.opdsPublicationView) {
            return <></>;
        }

        const {
            opdsPublicationView,
            verifyImport,
            openAccessButtonIsDisabled,
            sampleButtonIsDisabled,
            __,
        } = this.props;

        const openAccessLinksButton = () =>
            Array.isArray(opdsPublicationView.openAccessLinks)
                ? opdsPublicationView.openAccessLinks.map(
                    (ln, idx) =>
                        <span key={`openAccessControl-${idx}`}>
                            <button
                                onClick={() => verifyImport(
                                    ln,
                                    opdsPublicationView,
                                )}
                                className={stylesButtons.button_primary}
                                disabled={openAccessButtonIsDisabled()}
                            >
                                {`${__("catalog.addBookToLib")}${ln.properties?.indirectAcquisitionType ?
                                ` (${findExtWithMimeType(ln.properties.indirectAcquisitionType)})` :
                                (ln.type ? ` (${findExtWithMimeType(ln.type) || findExtWithMimeType(ln.type.replace("+json", "+zip"))})` : "")}`}
                            </button>
                            <OpdsLinkProperties
                                properties={ln.properties}
                            />
                        </span>,
                )
                : <></>;

        const sampleOrPreviewLinksButton = () =>
            Array.isArray(opdsPublicationView.sampleOrPreviewLinks)
                ? opdsPublicationView.sampleOrPreviewLinks.map(
                    (ln, idx) =>
                        <span key={`sampleControl-${idx}`}>
                            <button
                                onClick={() => verifyImport(
                                    ln,
                                    opdsPublicationView,
                                )}
                                className={stylesButtons.button_primary}
                                disabled={sampleButtonIsDisabled()}
                            >
                                <SVG svg={ImportIcon}/>
                                {__("opds.menu.addExtract")}
                            </button>
                            <OpdsLinkProperties
                                properties={ln.properties}
                            />
                        </span>,
                )
                : <></>;

        const feedLinksList = () => {

            const buyList = () =>
                Array.isArray(opdsPublicationView.buyLinks)
                    ? opdsPublicationView.buyLinks.map(
                        (ln, idx) =>
                            <span key={`buyControl-${idx}`}>
                                <button
                                    className={classNames(stylesButtons.button_primary, stylesGlobal.mb_20)}
                                    onClick={
                                        () => this.props.link(
                                            ln,
                                            this.props.location,
                                            `${__("opds.menu.goBuyBook")} (${opdsPublicationView.title}))`,
                                        )
                                    }

                                >
                                    <SVG svg={CartFillIcon}/>
                                    {__("opds.menu.goBuyBook")}
                                </button>
                                <br />
                                <OpdsLinkProperties properties={ln.properties} />
                            </span>,
                    )
                    : <></>;

            const borrowList = () =>
                Array.isArray(opdsPublicationView.borrowLinks)
                    ? opdsPublicationView.borrowLinks.map(
                        (ln, idx) =>
                            <span key={`borrowControl-${idx}`}>
                                <button
                                    className={stylesButtons.button_primary}
                                    onClick={() => this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goLoanBook")} (${opdsPublicationView.title})`)}
                                    disabled={ln.properties.indirectAcquisitionType === findMimeTypeWithExtension(MIME_TYPE_ADOBE_OBSOLETE_BORROWING_FORMAT)}
                                >
                                    {__("opds.menu.goLoanBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </span>,
                    )
                    : <></>;

            const subscribeList = () =>
                Array.isArray(opdsPublicationView.subscribeLinks)
                    ? opdsPublicationView.subscribeLinks.map(
                        (ln, idx) =>
                            <span key={`subscribeControl-${idx}`}>
                                <button
                                    className={stylesButtons.button_primary}
                                    onClick={() => this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goSubBook")} (${opdsPublicationView.title})`)}
                                >
                                    {__("opds.menu.goSubBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </span>,
                    )
                    : <></>;

            const revokeLoanList = () =>
                Array.isArray(opdsPublicationView.revokeLoanLinks) ? (
                    opdsPublicationView.revokeLoanLinks.map((ln, idx) => (
                        <span key={`revokeControl-${idx}`}>
                            <button
                                className={stylesButtons.button_primary}
                                onClick={() =>
                                    this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goRevokeLoanBook")} (${
                                            opdsPublicationView.title
                                        })`,
                                    )
                                }
                            >
                                {__("opds.menu.goRevokeLoanBook")}
                            </button>
                            <br />
                            <OpdsLinkProperties properties={ln.properties} />
                        </span>
                    ))
                ) : (
                    <></>
                );

            if (
                (Array.isArray(opdsPublicationView.buyLinks)
                    && opdsPublicationView.buyLinks.length)
                || (Array.isArray(opdsPublicationView.borrowLinks)
                    && opdsPublicationView.borrowLinks.length)
                || (Array.isArray(opdsPublicationView.subscribeLinks)
                    && opdsPublicationView.subscribeLinks.length)
                || (Array.isArray(opdsPublicationView.revokeLoanLinks)
                    && opdsPublicationView.revokeLoanLinks.length)
            ) {
                return (
                    <span>
                        {
                            buyList()
                        }
                        {
                            borrowList()
                        }
                        {
                            subscribeList()
                        }
                        {
                            revokeLoanList()
                        }
                    </span>
                );
            }
            return (<></>);
        };

        return (
            <>
                {
                    openAccessLinksButton()
                }
                {
                    sampleOrPreviewLinksButton()
                }
                {
                    feedLinksList()
                }
            </>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        verifyImport: (...data: Parameters<typeof importActions.verify.build>) => {
            dispatch(dialogActions.closeRequest.build());
            dispatch(importActions.verify.build(...data));
        },
        link: (...data: Parameters<ReturnType<typeof dispatchOpdsLink>>) =>
            dispatchOpdsLink(dispatch)(...data),
    };
};

const mapStateToProps = (state: ILibraryRootState, props: IBaseProps) => {
    return {
        breadcrumb: state.opds.browser.breadcrumb,
        location: state.router.location,
        openAccessButtonIsDisabled: () => {
            return !!state.download.find(
                ([{ downloadUrl }]) => props.opdsPublicationView.openAccessLinks.find(
                    (ln) => ln.url === downloadUrl,
                ),
            );
        },
        sampleButtonIsDisabled: () => {
            return !!state.download.find(
                ([{downloadUrl}]) => props.opdsPublicationView.sampleOrPreviewLinks.find(
                    (ln) => ln.url === downloadUrl,
                ),
            );
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
