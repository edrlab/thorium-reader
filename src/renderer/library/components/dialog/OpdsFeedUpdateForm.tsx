// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";

import {
    TranslatorProps,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { DialogCloseButton, DialogFooter, DialogHeader, DialogWithRadix, DialogWithRadixContent, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import { DialogClose, DialogTitle } from "@radix-ui/react-dialog";
import classNames from "classnames";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as FloppyDiskIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import * as penIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as linkIcon from "readium-desktop/renderer/assets/icons/link-icon.svg";
import * as EditIcon from "readium-desktop/renderer/assets/icons/edit.svg";


// eslint-disable-next-line @typescript-eslint/no-empty-interface

interface IBaseProps extends TranslatorProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface

interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}


const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    feed: (state.dialog.data as DialogType[DialogTypeName.DeleteOpdsFeedConfirm]).feed,
});



const OpdsUpdateForm = (props: IProps) => {
    const { feed } = props;
    const [__] = useTranslator();
    const [, apiAddFeedAction] = useApi(undefined, "opds/addFeed");

    const [title, setTitle] = React.useState(feed?.title,);
    const [url, setUrl] = React.useState(feed?.url);
    const addAction = () => {
        if (!title || !url) {
            return;
        }
        apiAction("opds/deleteFeed", props.feed.identifier).then(() => {
            apiAddFeedAction({ title, url });
        }).catch((err) => {
            console.error("Error to fetch api opds/deleteFeed", err);
        });

    };

    return <DialogWithRadix>
        <DialogWithRadixTrigger asChild>
            <button className={classNames(stylesButtons.button_transparency_icon, stylesBlocks.block_full_update)}>
                <SVG ariaHidden={true} svg={EditIcon} />
            </button>
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
                <div className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)}>
                    <label htmlFor="title">{__("opds.addForm.name")}</label>
                    <i><SVG ariaHidden svg={penIcon} /></i>
                    <input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e?.target?.value)}
                        type="text"
                        aria-label={__("opds.updateForm.name")}
                        required
                    />
                </div>
                <div className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)}>
                    <label htmlFor="url">{__("opds.updateForm.url")}</label>
                    <i><SVG ariaHidden svg={linkIcon} /></i>
                    <input
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e?.target?.value)}
                        type="text"
                        aria-label={__("opds.updateForm.url")}
                        required
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                    </DialogClose>
                    <DialogClose asChild>
                        <button type="submit" disabled={!title || !url} className={stylesButtons.button_primary_blue} onClick={() => addAction()}>
                            <SVG ariaHidden svg={FloppyDiskIcon} />
                            {__("opds.updateForm.updateButton")}
                        </button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </DialogWithRadixContent>
    </DialogWithRadix>;
};

export default OpdsUpdateForm;