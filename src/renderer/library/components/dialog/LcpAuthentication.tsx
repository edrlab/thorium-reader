// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import { shell } from "electron";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
// import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as InfoIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
// import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
// import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";
import * as FollowLinkIcon from "readium-desktop/renderer/assets/icons/followLink-icon.svg";
// import * as CrossIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as InfosIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as LockIcon from "readium-desktop/renderer/assets/icons/lock-icon.svg";
import * as KeyholeIcon from "readium-desktop/renderer/assets/icons/keyhole-icon.svg";
import * as LightBulbIcon from "readium-desktop/renderer/assets/icons/lightbulb-icon.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TChangeEventOnInput } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { lcpActions } from "readium-desktop/common/redux/actions";
import classNames from "classnames";
import { dialogActions } from "readium-desktop/common/redux/actions";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    password: string | undefined;
    // infoOpen: boolean;
}

export class LCPAuthentication extends React.Component<IProps, IState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.focusRef = React.createRef<HTMLInputElement>();

        this.state = {
            password: undefined,
            // infoOpen : false,
        };
    }

    public componentDidMount() {
        if (this.focusRef?.current) {
            this.focusRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.publicationView) {
            return <></>;
        }

        // const openInfo = (e: any) => {
        //     e.preventDefault();
        //     this.setState({infoOpen : !this.state.infoOpen});
        // };

        const { __ } = this.props;
        return <Dialog.Root defaultOpen={true} onOpenChange={(open) => { if (open === false) { this.props.closeDialog(); } }}>
            <Dialog.Portal>
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog} style={{maxWidth: "600px"}} onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    this.focusRef.current?.focus();
                }} aria-describedby={__("library.lcp.sentence")}>
                    <div className={stylesModals.modal_dialog_header}>
                        <Dialog.Title>
                            {__("library.lcp.sentence")}
                        </Dialog.Title>
                    </div>
                    <form className={stylesModals.modal_dialog_body}>
                        <p>
                            <span className={stylesModals.lcp_hint}>
                                <SVG ariaHidden svg={LightBulbIcon} />
                                <b>{__("library.lcp.hint")}</b> {this.props.hint}
                            </span>
                        </p>
                        <div className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)} style={{marginTop: "0", width: "99%"}}>
                            <label htmlFor="passphrase" style={{fontSize: "14px"}}>{__("library.lcp.password")}</label>
                            <SVG ariaHidden svg={KeyholeIcon} />
                            <input
                                id="passphrase"
                                aria-label={__("library.lcp.password")}
                                type="password"
                                onChange={this.onPasswordChange}
                                ref={this.focusRef}
                                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                            />
                        </div>
                        {
                            typeof this.props.message === "string" ?
                                <p className={stylesInputs.passphrase_infos}>
                                    <SVG ariaHidden svg={InfosIcon} />
                                    <span>{this.props.message}</span>
                                </p>
                                : <></>
                        }
                        {
                            this.props.urlHint?.href
                                ?
                                <a href=""
                                    onClick={async (ev) => {
                                        ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                        await shell.openExternal(this.props.urlHint.href);
                                    }} className={stylesModals.urlHint}>
                                    {this.props.urlHint.title || __("library.lcp.urlHint")}
                                </a>
                                : <></>
                        }
                        <details className={stylesButtons.button_catalog_infos}>
                            <summary>
                                {/* <SVG ariaHidden svg={InfoIcon} /> */}
                                {__("library.lcp.whatIsLcp?")}
                                {/* <SVG ariaHidden svg={this.state.infoOpen ? ChevronUp : ChevronDown} /> */}
                            </summary>
                            <div className={stylesCatalogs.catalog_infos_text}>
                                <p>
                                    {__("library.lcp.whatIsLcpInfoDetails")}
                                </p>
                                <a href=""
                                    onClick={async (ev) => {
                                        ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                        await shell.openExternal("https://www.edrlab.org/readium-lcp/");
                                    }}>
                                    {__("library.lcp.whatIsLcpInfoDetailsLink")}
                                    <SVG ariaHidden svg={FollowLinkIcon} />
                                </a>
                            </div>
                        </details>
                        <div className={stylesModals.modal_dialog_footer}>
                            <Dialog.Close asChild>
                                <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                            </Dialog.Close>
                            <Dialog.Close asChild>
                                <button type="submit" className={stylesButtons.button_primary_blue} onClick={this.submit}>
                                    <SVG ariaHidden svg={LockIcon} />
                                    {__("library.lcp.open")}</button>
                            </Dialog.Close>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>;
    }

    private onPasswordChange = (e: TChangeEventOnInput) => {
        this.setState({ password: e.target.value });
    };

    private submit = () => {
        // if (!this.state.password) {
        //     return;
        // }
        this.props.unlockPublication(this.props.publicationView.identifier, this.state.password);
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LcpAuthentication,
    }, ...state.dialog.data as DialogType[DialogTypeName.LcpAuthentication],
    locale: state.i18n.locale, // refresh
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        unlockPublication: (id: string, pass: string) => {
            dispatch(lcpActions.unlockPublicationWithPassphrase.build(id, pass));
        },
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LCPAuthentication));
