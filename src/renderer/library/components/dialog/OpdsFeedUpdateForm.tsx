// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
    feed: IOpdsFeedView;
    trigger: React.ReactNode;
}

interface IState {
    title: string | undefined;
    url: string | undefined;
}

class OpdsFeedUpdateForm extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            title: props.feed?.title,
            url: props.feed?.url,
        };
    }
    public render(): React.ReactElement<{}> {

        const { __ } = this.props;
        const { title, url } = this.state;
        return <Dialog.Root>
            <Dialog.Trigger asChild>
                {this.props.trigger}
            </Dialog.Trigger>
            <Dialog.Portal>
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={stylesModals.modal_dialog}>
                    <div className={stylesModals.modal_dialog_header}>
                        <Dialog.Title>
                            {__("opds.updateForm.title")}
                        </Dialog.Title>
                        <div>
                            <Dialog.Close asChild>
                                <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                    <SVG ariaHidden={true} svg={QuitIcon} />
                                </button>
                            </Dialog.Close>
                        </div>
                    </div>
                    <form className={stylesModals.modal_dialog_body}>
                        <div>
                            <div className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)}>
                                <label htmlFor="title">{__("opds.updateForm.name")}</label>
                                <input
                                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                    id="title"
                                    value={title}
                                    onChange={(e) => this.setState({
                                        title: e.target.value,
                                        // url: this.state.url || this.props.feed.url,
                                    })}
                                    type="text"
                                    aria-label={__("opds.updateForm.name")}
                                    required
                                />
                            </div>
                            <div className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)}>
                                <label htmlFor="url">{__("opds.updateForm.url")}</label>
                                <input
                                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                    id="url"
                                    value={url}
                                    onChange={(e) => this.setState({
                                        // name: this.state.name || this.props.feed.title,
                                        url: e.target.value,
                                    })}
                                    type="text"
                                    aria-label={__("opds.updateForm.url")}
                                    required
                                />
                            </div>
                        </div>
                        <div className={stylesModals.modal_dialog_footer}>
                            <Dialog.Close asChild>
                                <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                            </Dialog.Close>
                            <Dialog.Close asChild>
                                <button type="submit" disabled={!title || !url} className={stylesButtons.button_primary_blue} onClick={() => this.update()}>{__("opds.updateForm.updateButton")}</button>
                            </Dialog.Close>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>;
    }

    private update = () => {
        const title = this.state.title;
        const url = this.state.url;
        if (!title || !url) {
            return;
        }
        apiAction("opds/deleteFeed", this.props.feed.identifier).then(() => {
            apiAction("opds/addFeed", { title, url }).catch((err) => {
                console.error("Error to fetch api opds/addFeed", err);
            });
        }).catch((err) => {
            console.error("Error to fetch api opds/deleteFeed", err);
        });
    };

}

export default withTranslator(OpdsFeedUpdateForm);
