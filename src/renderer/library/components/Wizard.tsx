// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import SVG from "readium-desktop/renderer/common/components/SVG";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home-icon.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
// import BooksImage from "readium-desktop/renderer/assets/images/thorium_guided_2.png";
// import CatalogsImage from "readium-desktop/renderer/assets/images/thorium_guided_3.png";
// import ReadingImage from "readium-desktop/renderer/assets/images/thorium_guided_4.png";
// import AnnotationsImage from "readium-desktop/renderer/assets/images/thorium_guided_5.png";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
// import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
// import * as OpenBookIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
// import * as AnnotationsIcon from "readium-desktop/renderer/assets/icons/annotation-icon.svg";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { wizardActions } from "readium-desktop/common/redux/actions";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as LinkIcon from "readium-desktop/renderer/assets/icons/link-icon.svg";
import { shell } from "electron";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";


const TabTitle = (props: React.PropsWithChildren<{ title: string }>) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{props.title}</h2>
            {props.children}
        </div>
    );
};

const TabHeader = (props: React.PropsWithChildren<{ title: string }>) => {
    const [__] = useTranslator();
    return (
        <div key="modal-header" className={stylesSettings.close_button_div}>
            <TabTitle title={props.title}>
                {props.children}
            </TabTitle>
            <Dialog.Close asChild>
                <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")} >
                    <SVG ariaHidden={true} svg={QuitIcon} />
                </button>
            </Dialog.Close>
        </div>
    );
};

export const WizardModal = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const opened = useSelector((state: ILibraryRootState) => state.wizard.opened_v340);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
        const isRTL = locale === "ar";

    const [checked, setChecked] = React.useState(false);

    return <Dialog.Root defaultOpen={!opened} onOpenChange={(openState: boolean) => {
        if (checked && openState == false) {
            dispatch(wizardActions.setWizard.build(true));
        }
    }}
    >
        {/* <Dialog.Trigger asChild>
        <button title={__("header.settings")}>
            <h3>Visite Guidée</h3>
        </button>
        </Dialog.Trigger> */}
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
                <Tabs.Root defaultValue="tab1" data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                    <TabHeader title={""} />
                    <Tabs.List className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                        <Tabs.Trigger value="tab1">
                            <SVG ariaHidden svg={HomeIcon} />
                            <h4>{__("wizard.tab.home")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab2">
                            <SVG ariaHidden svg={LinkIcon} />
                            <h4>{__("wizard.tab.resources")}</h4>
                        </Tabs.Trigger>
                        <div style={{display: "flex", alignItems: "center", gap: "10px", position: "absolute", bottom: "30px", left: "30px"}}>
                            <input type="checkbox" checked={checked} onChange={() => { setChecked(!checked); }} id="wizardCheckbox" name="wizardCheckbox" className={stylesGlobal.checkbox_custom_input} />
                            {/* label htmlFor clicked with mouse cursor causes onChange() of input (which is display:none), but keyboard interaction (tab stop and space bar toggle) occurs with the div role="checkbox" below! (onChange is not called, only onKeyUp) */}
                            <label htmlFor="wizardCheckbox" className={stylesGlobal.checkbox_custom_label}>
                                <div
                                    tabIndex={0}
                                    role="checkbox"
                                    aria-checked={checked}
                                    aria-label={__("wizard.dontShow")}
                                    onKeyDown={(e) => {
                                        // if (e.code === "Space") {
                                        if (e.key === " ") {
                                            e.preventDefault(); // prevent scroll
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        // Includes screen reader tests:
                                        // if (e.code === "Space") { WORKS
                                        // if (e.key === "Space") { DOES NOT WORK
                                        // if (e.key === "Enter") { WORKS
                                        if (e.key === " ") { // WORKS
                                            e.preventDefault();
                                            setChecked(!checked);
                                        }
                                    }}
                                    className={stylesGlobal.checkbox_custom}
                                    style={{ border: checked ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: checked ? "var(--color-brand-primary)" : "transparent" }}>
                                    {checked ?
                                        <SVG ariaHidden svg={CheckIcon} />
                                        :
                                        <></>
                                    }
                                </div>
                                <span aria-hidden>
                                {__("wizard.dontShow")}
                                </span>
                            </label>
                        </div>
                    </Tabs.List>
                    <div className={classNames(stylesSettings.settings_content, stylesModals.guidedTour_content)} style={{ marginTop: "70px" }}>
                        <Tabs.Content value="tab1" tabIndex={-1} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" style={{height: "100%"}}>
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)} style={{height: "inherit", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                                <div>
                                    <h3 style={{marginBottom: "40px"}}>{__("wizard.title.welcome")}</h3>
                                    <p>{__("wizard.description.home")}</p>
                                </div>
                                <div className={stylesModals.guidedTour_buttons}>
                                    <Dialog.Close className={stylesButtons.button_nav_primary}>
                                        <SVG ariaHidden svg={ShelfIcon} />
                                        {__("wizard.buttons.goToBooks")}
                                    </Dialog.Close>
                                    <Tabs.List>
                                        <Tabs.Trigger value="tab2" className={stylesButtons.button_primary_blue} onFocus={(e) => e.preventDefault()}>
                                            <SVG ariaHidden svg={ArrowRightIcon} />
                                            {__("wizard.buttons.discover")}
                                        </Tabs.Trigger>
                                    </Tabs.List>

                                </div>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab2" tabIndex={-1} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" style={{height: "100%"}}>
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)} style={{height: "inherit", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                                <div>
                                    <h3 style={{marginBottom: "40px"}}>{__("wizard.title.resources")}</h3>
                                    <div>
                                        <p style={{ marginBottom: "20px" }}>{__("wizard.description.resources")}</p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                            <a dir={isRTL ? "rtl" : "ltr"}
                                                style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "16px", fontWeight: "500" }}
                                                href=""
                                                onClick={async (ev) => {
                                                    ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                                    const href = "https://www.thoriumreader.com";
                                                    if (href && /^https?:\/\//.test(href)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                                                        await shell.openExternal(href);
                                                    }
                                                }}>
                                                🌐 {__("wizard.resources.website", { url: "https://www.thoriumreader.com" })}
                                            </a>
                                            <a dir={isRTL ? "rtl" : "ltr"} href=""
                                                style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "16px", fontWeight: "500" }}
                                                onClick={async (ev) => {
                                                    ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                                    const href = "https://discord.com/invite/84wgWhFKDY";
                                                    if (href && /^https?:\/\//.test(href)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                                                        await shell.openExternal(href);
                                                    }
                                                }}>
                                                💬 {__("wizard.resources.discord", { url: "https://discord.gg/84wgWhFKDY" })}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className={stylesModals.guidedTour_buttons}>
                                    <Dialog.Close className={stylesButtons.button_primary_blue}>
                                        <SVG ariaHidden svg={ShelfIcon} />
                                        {__("wizard.buttons.goToBooks")}
                                    </Dialog.Close>
                                </div>
                            </div>
                        </Tabs.Content>
                    </div>
                </Tabs.Root>

                {/* <div className={stylesSettings.close_button_div}>
                    <Dialog.Close asChild>
                        <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                </div> */}
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
