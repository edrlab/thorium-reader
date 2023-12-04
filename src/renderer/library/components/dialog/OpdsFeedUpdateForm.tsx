// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
// import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
// import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { DialogClose, DialogCloseButton, DialogFooter, DialogHeader, DialogTitle, DialogWithRadix, DialogWithRadixContent, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";

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
        return <DialogWithRadix>
            <DialogWithRadixTrigger asChild>
                {this.props.trigger}
            </DialogWithRadixTrigger>
            <DialogWithRadixContent>
                <DialogHeader>
                    <DialogTitle>
                        {__("opds.updateForm.title")}
                    </DialogTitle>
                    <div>
                        <DialogCloseButton />
                    </div>
                </DialogHeader>
                <form className={stylesModals.modal_dialog_body}>
                    <div className={stylesInputs.form_group}>
                        <label htmlFor="title">{__("opds.updateForm.name")}</label>
                        <input
                            id="title"
                            value={title}
                            onChange={(e) => this.setState({
                                title: e.target.value,
                                // url: this.state.url || this.props.feed.url,
                            })}
                            type="text"
                            aria-label={__("opds.updateForm.name")}
                            defaultValue={title}
                            required
                        />
                    </div>
                    <div className={stylesInputs.form_group}>
                        <label htmlFor="url">{__("opds.updateForm.url")}</label>
                        <input
                            id="url"
                            value={url}
                            onChange={(e) => this.setState({
                                // name: this.state.name || this.props.feed.title,
                                url: e.target.value,
                            })}
                            type="text"
                            aria-label={__("opds.updateForm.url")}
                            defaultValue={url}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <button className={stylesButtons.button_primary}>{__("dialog.cancel")}</button>
                        </DialogClose>
                        <DialogClose asChild>
                            <button type="submit" disabled={!title || !url} className={stylesButtons.button_secondary} onClick={() => this.update()}>{__("opds.updateForm.updateButton")}</button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogWithRadixContent>
        </DialogWithRadix>;
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
