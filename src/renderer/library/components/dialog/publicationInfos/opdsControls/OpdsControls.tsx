// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { ToastType } from "readium-desktop/common/models/toast";
import { dialogActions, importActions, toastActions } from "readium-desktop/common/redux/actions/";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { findExtWithMimeType } from "readium-desktop/utils/mimeTypes";

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

        this.addFeedToCatalogs = this.addFeedToCatalogs.bind(this);
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

        const addFeedFromCatalogsButton = () => {
            const url = opdsPublicationView.entryLinks.reduce<string>((pv, cv) => cv.rel === "http://opds-spec.org/catalog" ? cv.url : pv, undefined);
            if (url) {

                return <button
                    onClick={() => this.addFeedToCatalogs(opdsPublicationView.title, url)}
                    className={styles.lire}
                >
                    Add to catalogs
                </button>;
            } else {
                return <></>;
            }
        };


        const openAccessLinksButton = () =>
            Array.isArray(opdsPublicationView.openAccessLinks)
                ? opdsPublicationView.openAccessLinks.map(
                    (ln, idx) =>
                        <div key={`openAccessControl-${idx}`}>
                            <button
                                onClick={() => verifyImport(
                                    ln,
                                    opdsPublicationView,
                                )}
                                className={styles.lire}
                                disabled={openAccessButtonIsDisabled()}
                            >
                                {`${__("catalog.addBookToLib")}${ln.properties?.indirectAcquisitionType ?
                                    ` (${findExtWithMimeType(ln.properties.indirectAcquisitionType)})` :
                                    (ln.type ? ` (${findExtWithMimeType(ln.type) || findExtWithMimeType(ln.type.replace("+json", "+zip"))})` : "")}`}
                            </button>
                            <OpdsLinkProperties
                                properties={ln.properties}
                            />
                        </div>,
                )
                : <></>;

        const sampleOrPreviewLinksButton = () =>
            Array.isArray(opdsPublicationView.sampleOrPreviewLinks)
                ? opdsPublicationView.sampleOrPreviewLinks.map(
                    (ln, idx) =>
                        <div key={`sampleControl-${idx}`}>
                            <button
                                onClick={() => verifyImport(
                                    ln,
                                    opdsPublicationView,
                                )}
                                className={styles.lire}
                                disabled={sampleButtonIsDisabled()}
                            >
                                {__("opds.menu.addExtract")}
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
                    ? opdsPublicationView.buyLinks.map(
                        (ln, idx) =>
                            <li
                                key={`buyControl-${idx}`}
                            >
                                <button
                                    className={styles.lire}
                                    onClick={
                                        () => this.props.link(
                                            ln,
                                            this.props.location,
                                            `${__("opds.menu.goBuyBook")} (${opdsPublicationView.title}))`,
                                        )
                                    }

                                >
                                    {__("opds.menu.goBuyBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </li>,
                    )
                    : <></>;

            const borrowList = () =>
                Array.isArray(opdsPublicationView.borrowLinks)
                    ? opdsPublicationView.borrowLinks.map(
                        (ln, idx) =>
                            <li
                                key={`borrowControl-${idx}`}
                            >
                                <button
                                    className={styles.lire}
                                    onClick={() => this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goLoanBook")} (${opdsPublicationView.title})`)}
                                >
                                    {__("opds.menu.goLoanBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </li>,
                    )
                    : <></>;

            const subscribeList = () =>
                Array.isArray(opdsPublicationView.subscribeLinks)
                    ? opdsPublicationView.subscribeLinks.map(
                        (ln, idx) =>
                            <li
                                key={`subscribeControl-${idx}`}
                            >
                                <button
                                    className={styles.lire}
                                    onClick={() => this.props.link(
                                        ln,
                                        this.props.location,
                                        `${__("opds.menu.goSubBook")} (${opdsPublicationView.title})`)}
                                >
                                    {__("opds.menu.goSubBook")}
                                </button>
                                <OpdsLinkProperties properties={ln.properties} />
                            </li>,
                    )
                    : <></>;

            const revokeLoanList = () =>
                Array.isArray(opdsPublicationView.revokeLoanLinks) ? (
                    opdsPublicationView.revokeLoanLinks.map((ln, idx) => (
                        <li key={`revokeControl-${idx}`}>
                            <button
                                className={styles.lire}
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
                            <OpdsLinkProperties properties={ln.properties} />
                        </li>
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
                    <ul className={styles.liens}>
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
                    </ul>
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
                {
                    addFeedFromCatalogsButton()
                }
            </>
        );
    }

    public addFeedToCatalogs(title: string, url: string) {
        apiAction("opds/addFeed", { title, url }).catch((err) => {
            console.error("Error to fetch api opds/addFeed", err);
        }).then(() => this.props.toastSuccess());
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
        toastSuccess: () =>
            dispatch(toastActions.openRequest.build(ToastType.Success, "👍")),
    };

};

const mapStateToProps = (state: ILibraryRootState, props: IBaseProps) => {
    return {
        breadcrumb: state.opds.browser.breadcrumb,
        location: state.router.location,
        openAccessButtonIsDisabled: () => {
            return !!state.download.find(
                ([{downloadUrl}]) => props.opdsPublicationView.openAccessLinks.find(
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
