// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { dialogActions, importActions } from "readium-desktop/common/redux/actions/";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

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
                                <a
                                    role="menuitem"
                                    href={ln.url}
                                >
                                    {__("opds.menu.goBuyBook")}
                                </a>
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
                            <a
                                role="menuitem"
                                href={ln.url}
                            >
                                {__("opds.menu.goLoanBook")}
                            </a>
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
                                <a
                                    role="menuitem"
                                    href={ln.url}
                                >
                                    {__("opds.menu.goSubBook")}
                                </a>
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
    };
};

const mapStateToProps = (state: RootState, props: IBaseProps) => {
    return {
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
