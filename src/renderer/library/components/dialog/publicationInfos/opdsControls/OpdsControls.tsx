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
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as CartFillIcon from "readium-desktop/renderer/assets/icons/cart-fill.svg";
import * as ImportIcon from "readium-desktop/renderer/assets/icons/import.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TDispatch } from "readium-desktop/typings/redux";
import { findExtWithMimeType, findMimeTypeWithExtension, ADOBE_ADEPT_XML } from "readium-desktop/utils/mimeTypes";

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

        const boxStyle = { height: "50px", padding: "0.4em", paddingTop: "0.2em", marginBottom: "0.5em", marginTop: "0.4em", fontSize: "14px" };

        const m = findMimeTypeWithExtension(ADOBE_ADEPT_XML);
        const orderLinks = (links: IOpdsLinkView[]) => {
            return Array.from(links).sort((a, b) => {
                if (a.properties?.indirectAcquisitionTypes?.top === m
                    && b.properties?.indirectAcquisitionTypes?.top === m) {
                    return 0;
                }
                if (a.properties?.indirectAcquisitionTypes?.top === m
                    && b.properties?.indirectAcquisitionTypes?.top !== m) {
                    return 1;
                }
                if (a.properties?.indirectAcquisitionTypes?.top !== m
                    && b.properties?.indirectAcquisitionTypes?.top === m) {
                    return -1;
                }
                return 0;
            });
        };

        const adjustDisplayType = (str: string | undefined) => str?.replace("lcpl", "LCP").replace("lcpdf", "PDF").replace("pdf", "PDF").replace("epub", "EPUB");
        const typeStr = (ln: IOpdsLinkView) => {
            return ln.properties?.indirectAcquisitionTypes?.top ?
                ` (${adjustDisplayType(findExtWithMimeType(ln.properties.indirectAcquisitionTypes.top)) || ln.properties.indirectAcquisitionTypes.top}${ln.properties?.indirectAcquisitionTypes?.child ? ` ${adjustDisplayType(findExtWithMimeType(ln.properties.indirectAcquisitionTypes.child)) || ln.properties.indirectAcquisitionTypes.child}` : ""})` :
                (ln.type ? ` (${adjustDisplayType(findExtWithMimeType(ln.type)) || adjustDisplayType(findExtWithMimeType(ln.type.replace("+json", "+zip")))})` : "");
        };

        const openAccessLinksButton = () =>
            Array.isArray(opdsPublicationView.openAccessLinks)
                ? orderLinks(opdsPublicationView.openAccessLinks).map(
                    (ln, idx) =>
                        <div key={`openAccessControl-${idx}`} style={ln.properties && Object.keys(ln.properties).length ? boxStyle : {}}>
                            <button
                                onClick={() => verifyImport(
                                    ln,
                                    opdsPublicationView,
                                )}
                                className={feedLinksList.length > 0 ? stylesButtons.button_secondary : stylesButtons.button_primary}
                                disabled={openAccessButtonIsDisabled()}
                            >
                                {`${__("catalog.addBookToLib")}${typeStr(ln)}`}
                            </button>
                            <OpdsLinkProperties
                                properties={ln.properties}
                            />
                        </div>,
                )
                : <></>;

        const sampleOrPreviewLinksButton = () =>
            Array.isArray(opdsPublicationView.sampleOrPreviewLinks)
                ? orderLinks(opdsPublicationView.sampleOrPreviewLinks).map(
                    (ln, idx) =>
                        <div key={`sampleControl-${idx}`} style={ln.properties && Object.keys(ln.properties).length ? boxStyle : {}}>
                            <button
                                onClick={() => verifyImport(
                                    ln,
                                    opdsPublicationView,
                                )}
                                className={stylesButtons.button_secondary}
                                disabled={sampleButtonIsDisabled()}
                            >
                                <SVG ariaHidden={true} svg={ImportIcon} />
                                {`${__("opds.menu.addExtract")}${typeStr(ln)}`}
                            </button>
                            <OpdsLinkProperties
                                properties={ln.properties}
                            />
                        </div>,
                )
                : <></>;

        const feedLinksList = () => {

            const buyList = () =>
                Array.isArray(opdsPublicationView.buyLinks)
                    ? orderLinks(opdsPublicationView.buyLinks).map(
                        (ln, idx) =>
                            <div key={`buyControl-${idx}`} style={ln.properties && Object.keys(ln.properties).length ? boxStyle : {}}>
                                <button
                                    className={classNames(stylesButtons.button_primary, stylesGlobal.mb_20)}
                                    onClick={
                                        () => this.props.link(
                                            ln,
                                            this.props.location,
                                            `${__("opds.menu.goBuyBook")} (${opdsPublicationView.documentTitle}))`,
                                        )
                                    }

                                >
                                    <SVG ariaHidden={true} svg={CartFillIcon} />
                                    {__("opds.menu.goBuyBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </div>,
                    )
                    : <></>;

            const borrowList = () =>
                Array.isArray(opdsPublicationView.borrowLinks)
                    ? orderLinks(opdsPublicationView.borrowLinks).map(
                        (ln, idx) =>
                            <div key={`borrowControl-${idx}`} style={ln.properties && Object.keys(ln.properties).length ? boxStyle : {}}>
                                <button
                                    className={buyList.length > 0 ? stylesButtons.button_secondary : stylesButtons.button_primary}
                                    onClick={() => this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goLoanBook")} (${opdsPublicationView.documentTitle})`)}
                                    disabled={ln.properties.indirectAcquisitionTypes?.top === findMimeTypeWithExtension(ADOBE_ADEPT_XML)}
                                >
                                    {__("opds.menu.goLoanBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </div>,
                    )
                    : <></>;

            const subscribeList = () =>
                Array.isArray(opdsPublicationView.subscribeLinks)
                    ? orderLinks(opdsPublicationView.subscribeLinks).map(
                        (ln, idx) =>
                            <div key={`subscribeControl-${idx}`} style={ln.properties && Object.keys(ln.properties).length ? boxStyle : {}}>
                                <button
                                    className={stylesButtons.button_secondary}
                                    onClick={() => this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goSubBook")} (${opdsPublicationView.documentTitle})`)}
                                >
                                    {__("opds.menu.goSubBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </div>,
                    )
                    : <></>;

            const revokeLoanList = () =>
                Array.isArray(opdsPublicationView.revokeLoanLinks) ? (
                    orderLinks(opdsPublicationView.revokeLoanLinks).map((ln, idx) => (
                        <div key={`revokeControl-${idx}`} style={ln.properties && Object.keys(ln.properties).length ? boxStyle : {}}>
                            <button
                                className={stylesButtons.button_secondary}
                                onClick={() =>
                                    this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goRevokeLoanBook")} (${opdsPublicationView.documentTitle
                                        })`,
                                    )
                                }
                            >
                                {__("opds.menu.goRevokeLoanBook")}
                            </button>
                            <OpdsLinkProperties properties={ln.properties} />
                        </div>
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
                    <div>
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
                    </div>
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
                ([{ downloadUrl }]) => props.opdsPublicationView.sampleOrPreviewLinks.find(
                    (ln) => ln.url === downloadUrl,
                ),
            );
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
