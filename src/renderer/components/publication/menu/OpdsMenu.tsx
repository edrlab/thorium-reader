// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { importActions } from "readium-desktop/common/redux/actions/";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
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

export class OpdsMenu extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

    }

    public render(): React.ReactElement<{}> {

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
                            key={`openAccess-${idx}`}
                            onClick={() => verifyImport(
                                ln,
                                opdsPublicationView.r2OpdsPublicationBase64,
                                opdsPublicationView.title,
                            )}
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
                            key={`sample-${idx}`}
                            onClick={() => verifyImport(
                                ln,
                                opdsPublicationView.r2OpdsPublicationBase64,
                                opdsPublicationView.title,
                            )}
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
                            <a
                                key={`buy-${idx}`}
                                role="menuitem"
                                href={ln.url}
                            >
                                {__("opds.menu.goBuyBook")}
                            </a>,
                    )
                    : <></>;

            const borrowList = () =>
                Array.isArray(opdsPublicationView.borrowLinks)
                    ? opdsPublicationView.borrowLinks.map(
                        (ln, idx) =>
                            <a
                                key={`borrow-${idx}`}
                                role="menuitem"
                                href={ln.url}
                            >
                                {__("opds.menu.goLoanBook")}
                            </a>,
                    )
                    : <></>;

            const subscribeList = () =>
                Array.isArray(opdsPublicationView.subscribeLinks)
                    ? opdsPublicationView.subscribeLinks.map(
                        (ln, idx) =>
                            <a
                                key={`subscribe-${idx}`}
                                role="menuitem"
                                href={ln.url}
                            >
                                {__("opds.menu.goSubBook")}
                            </a>,
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
                    <>
                        {
                            buyList()
                        }
                        {
                            borrowList()
                        }
                        {
                            subscribeList()
                        }
                    </>
                );
            }
            return (<></>);
        };
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo}
                >
                    {__("opds.menu.aboutBook")}
                </button>
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

    private displayPublicationInfo = (e: TMouseEventOnButton) => {
        e.preventDefault();
        this.props.displayPublicationInfo();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds,
                {
                    publication: props.opdsPublicationView,
                },
            ));
        },
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

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsMenu));
