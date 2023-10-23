// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { DialogClose, DialogCloseButton, DialogFooter, DialogHeader, DialogTitle, DialogWithRadix, DialogWithRadixContent, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";

export const ApiappAddFormDialog = () => {
    const [__] = useTranslator();
    const [, apiAddFeedAction] = useApi(undefined, "opds/addFeed");

    const [title, setTitle] = React.useState("");
    const [url, setUrl] = React.useState("");
    const addAction = () => {
        if (!title || !url) {
            return;
        }
        apiAddFeedAction({ title, url });
    }

    return <DialogWithRadix>
        <DialogWithRadixTrigger asChild>
            <button
                className={stylesButtons.button_primary}
            >
                <SVG ariaHidden={true} svg={AddIcon} />
                <span>{__("opds.addMenu")}</span>
            </button>
        </DialogWithRadixTrigger>
        <DialogWithRadixContent>
            <DialogHeader>
                <DialogTitle>
                    {__("opds.addMenu")}
                </DialogTitle>
                <div>
                    <DialogCloseButton />
                </div>
            </DialogHeader>
            <form>
                <div className={stylesInputs.form_group}>
                    <label htmlFor="title">{__("opds.addForm.name")}</label>
                    <input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e?.target?.value)}
                        type="text"
                        aria-label={__("opds.addForm.name")}
                        placeholder={__("opds.addForm.namePlaceholder")}
                        defaultValue={title}
                        required
                    />
                </div>
                <div className={stylesInputs.form_group}>
                    <label htmlFor="url">{__("opds.addForm.url")}</label>
                    {/* <Form.Control asChild> */}
                    <input
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e?.target?.value)}
                        type="text"
                        aria-label={__("opds.addForm.url")}
                        placeholder={__("opds.addForm.urlPlaceholder")}
                        defaultValue={url}
                        required
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <button className={stylesButtons.button_primary}>{__("dialog.cancel")}</button>
                    </DialogClose>
                    <DialogClose asChild>
                        <button type="submit" disabled={!title || !url} className={stylesButtons.button_secondary} onClick={() => addAction()}>{__("opds.addForm.addButton")}</button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </DialogWithRadixContent>
    </DialogWithRadix>;
};

export default ApiappAddFormDialog;