// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { shell } from "electron";
import { Location } from "history";
import * as React from "react";
import { connect } from "react-redux";
import { matchPath } from "react-router";
import { dialogActions, importActions } from "readium-desktop/common/redux/actions/";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/opds/route";
import { RootState } from "readium-desktop/renderer/redux/states";
import {
    dispatchHistoryPush, IOpdsBrowse, IRouterLocationState, routes,
} from "readium-desktop/renderer/routing";
import { TDispatch } from "readium-desktop/typings/redux";
import { ContentType } from "readium-desktop/utils/content-type";

import { IBreadCrumbItem } from "../../layout/BreadCrumb";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: IOpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
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
            handleOpdsLink,
        } = this.props;

        const openAccessLinksButton = () =>
            Array.isArray(opdsPublicationView.openAccessLinks)
                ? opdsPublicationView.openAccessLinks.map(
                    (ln, idx) =>
                        <button
                            key={`openAccessControl-${idx}`}
                            onClick={() => verifyImport(
                                ln,
                                opdsPublicationView.r2OpdsPublicationBase64,
                                opdsPublicationView.title,
                            )}
                            className={styles.lire}
                            disabled={openAccessButtonIsDisabled()}
                        >
                            {__("catalog.addBookToLib")}
                        </button>,
                )
                : <></>;

        const sampleOrPreviewLinksButton = () =>
            Array.isArray(opdsPublicationView.sampleOrPreviewLinks)
                ? opdsPublicationView.sampleOrPreviewLinks.map(
                    (ln, idx) =>
                        <button
                            key={`sampleControl-${idx}`}
                            onClick={() => verifyImport(
                                ln,
                                opdsPublicationView.r2OpdsPublicationBase64,
                                opdsPublicationView.title,
                            )}
                            className={styles.lire}
                            disabled={sampleButtonIsDisabled()}
                        >
                            {__("opds.menu.addExtract")}
                        </button>,
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
                                    onClick={() => handleOpdsLink(
                                            opdsPublicationView,
                                            ln,
                                            this.props.location,
                                            this.props.breadcrumb,
                                            __("opds.menu.goBuyBook"))}
                                >
                                    {__("opds.menu.goBuyBook")}
                                </button>
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
                                onClick={() => handleOpdsLink(
                                        opdsPublicationView,
                                        ln,
                                        this.props.location,
                                        this.props.breadcrumb,
                                        __("opds.menu.goLoanBook"))}
                            >
                                {__("opds.menu.goLoanBook")}
                            </button>
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
                                    onClick={() => handleOpdsLink(
                                            opdsPublicationView,
                                            ln,
                                            this.props.location,
                                            this.props.breadcrumb,
                                            __("opds.menu.goSubBook"))}
                                >
                                    {__("opds.menu.goSubBook")}
                                </button>
                            </li>,
                    )
                    : <></>;

            if (
                (Array.isArray(opdsPublicationView.buyLinks)
                    && opdsPublicationView.buyLinks.length)
                || (Array.isArray(opdsPublicationView.borrowLinks)
                    && opdsPublicationView.borrowLinks.length)
                || (Array.isArray(opdsPublicationView.subscribeLinks)
                    && opdsPublicationView.subscribeLinks.length)
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
        handleOpdsLink: (
            opdsPublicationView: IOpdsPublicationView,
            ln: IOpdsLinkView,
            location: Location<IRouterLocationState>,
            _breadcrumb: IBreadCrumbItem[],
            linkLabel: string) => {

            dispatch(dialogActions.closeRequest.build());

            if (ln.type === ContentType.Html || ln.type === ContentType.Xhtml) {
                shell.openExternal(ln.url);
            } else if (ln.type === ContentType.Opds2 ||
                ln.type === ContentType.Opds2Auth ||
                ln.type === ContentType.Opds2Pub ||
                ln.type === ContentType.AtomXml) {

                const param = matchPath<IOpdsBrowse>(
                    location.pathname, routes["/opds/browse"],
                ).params;
                const lvl = parseInt(param.level, 10);
                // const i = (lvl > 1) ? (lvl - 1) : lvl;
                // const name = breadcrumb[i] && breadcrumb[i].name;
                const newLvl = lvl === 1 ? 3 : (lvl + 1);
                const label = `${linkLabel} (${opdsPublicationView.title})`;

                const route = buildOpdsBrowserRoute(
                    param.opdsId,
                    label,
                    ln.url, // this.props.headerLinks?.self
                    newLvl,
                );

                dispatchHistoryPush(dispatch)({
                    ...location,
                    pathname: route,
                    // state: {} // we preserve the existing route state
                });
            } else {
                shell.openExternal(ln.url);
            }
        },
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
        breadcrumb: state.opds.browser.breadcrumb,
        location: state.router.location,
        openAccessButtonIsDisabled: () => {
            return !!state.download.downloads.find(
                (dl) => props.opdsPublicationView.openAccessLinks.find(
                    (ln) => ln.url === dl.url,
                ),
            );
        },
        sampleButtonIsDisabled: () => {
            return !!state.download.downloads.find(
                (dl) => props.opdsPublicationView.sampleOrPreviewLinks.find(
                    (ln) => ln.url === dl.url,
                ),
            );
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsControls));
