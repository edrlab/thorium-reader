// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import { shell } from "electron";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import classNames from "classnames";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";
import * as FollowLinkIcon from "readium-desktop/renderer/assets/icons/followLink-icon.svg";
import * as penIcon from "readium-desktop/renderer/assets/icons/pen-icon.svg";
import * as linkIcon from "readium-desktop/renderer/assets/icons/link-icon.svg";
import * as GlobeIcon from "readium-desktop/renderer/assets/icons/globe-icon-bold.svg";

export const OpdsFeedHowDoesItWorksInfoBox = () => {

    const [__] = useTranslator();
    const [infoOpen, setInfoOpen] = React.useState(false);


    return (<div>
        <button className={stylesButtons.button_catalog_infos} onClick={(e) => { e.preventDefault(); setInfoOpen(!infoOpen); }}>
            <SVG ariaHidden svg={InfoIcon} />
            {__("opds.whatIsOpds")}
            <SVG ariaHidden svg={infoOpen ? ChevronUp : ChevronDown} />
        </button>
        {infoOpen ?
            <div className={stylesCatalogs.catalog_infos_text}>
                <p>
                    {__("opds.informations")}
                </p>
                <a href=""
                    onClick={async (ev) => {
                        ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                        await shell.openExternal("https://opds.io/");
                    }}>
                    {__("opds.documentation")}
                    <SVG ariaHidden svg={FollowLinkIcon} />
                </a>
            </div>
            : <></>}
    </div>);
};

export const OpdsFeedAddFormDialog = () => {
    const [__] = useTranslator();
    const [, apiAddFeedAction] = useApi(undefined, "opds/addFeed");

    const [title, setTitle] = React.useState("");
    const [url, setUrl] = React.useState("");
    const addAction = () => {
        if (!title || !url) {
            return;
        }
        apiAddFeedAction({ title, url });
    };


    return <Dialog.Root>
        <Dialog.Trigger asChild>
            <button
                className={classNames(stylesButtons.button_nav_primary)}
            >
                <SVG ariaHidden={true} svg={GlobeIcon} />
                <span>{__("opds.addMenu")}</span>
            </button>
        </Dialog.Trigger>
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={stylesModals.modal_dialog} aria-describedby={undefined}>
                <div className={stylesModals.modal_dialog_header}>
                    <Dialog.Title>
                        {__("opds.addMenu")}
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
                            <label htmlFor="title">{__("opds.addForm.name")}</label>
                            <i><SVG ariaHidden svg={penIcon} /></i>
                            <input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e?.target?.value)}
                                type="text"
                                aria-label={__("opds.addForm.name")}
                                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                // placeholder={__("opds.addForm.namePlaceholder")}
                                required
                            />
                        </div>
                        <div className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)}>
                            <label htmlFor="url">{__("opds.addForm.url")}</label>
                            {/* <Form.Control asChild> */}
                            <i><SVG ariaHidden svg={linkIcon} /></i>
                            <input
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e?.target?.value)}
                                type="text"
                                aria-label={__("opds.addForm.url")}
                                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                // placeholder={__("opds.addForm.urlPlaceholder")}
                                required
                            />
                        </div>
                        <OpdsFeedHowDoesItWorksInfoBox />
                    </div>
                    <div className={stylesModals.modal_dialog_footer}>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                        </Dialog.Close>
                        <Dialog.Close asChild>
                            <button type="submit" disabled={!title || !url} className={stylesButtons.button_primary_blue} onClick={() => addAction()}>
                                <SVG ariaHidden svg={AddIcon} />
                                {__("opds.addForm.addButton")}
                            </button>
                        </Dialog.Close>
                    </div>
                </form>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
