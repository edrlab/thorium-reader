// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home-icon.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import HomeImage from "readium-desktop/renderer/assets/images/thorium_guided_1.png";
import BooksImage from "readium-desktop/renderer/assets/images/thorium_guided_2.png";
import CatalogsImage from "readium-desktop/renderer/assets/images/thorium_guided_3.png";
import ReadingImage from "readium-desktop/renderer/assets/images/thorium_guided_4.png";
import AnnotationsImage from "readium-desktop/renderer/assets/images/thorium_guided_5.png";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as OpenBookIcon from "readium-desktop/renderer/assets/icons/open_book.svg";
import * as AnnotationsIcon from "readium-desktop/renderer/assets/icons/annotation-icon.svg";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/arrow-right.svg";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { wizardActions } from "readium-desktop/common/redux/actions";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

const TabTitle = (props: React.PropsWithChildren<{ title: string }>) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{props.title}</h2>
            {props.children}
        </div>
    );
};

const TabHeader = (props: React.PropsWithChildren<{ title: string }>) => {

    return (
        <div key="modal-header" className={stylesSettings.close_button_div}>
            <TabTitle title={props.title}>
                {props.children}
            </TabTitle>
            <Dialog.Close asChild>
                <button className={stylesButtons.button_transparency_icon} aria-label="Close" >
                    <SVG ariaHidden={true} svg={QuitIcon} />
                </button>
            </Dialog.Close>
        </div>
    );
};

export const WizardModal = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const opened = useSelector((state: ILibraryRootState) => state.wizard.opened);

    const [checked, setChecked] = React.useState(true);

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
            <Dialog.Content className={classNames(stylesModals.modal_dialog)}>
                <Tabs.Root defaultValue="tab1" data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                    <Tabs.List className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                        <Tabs.Trigger value="tab1">
                            <SVG ariaHidden svg={HomeIcon} />
                            <h4>{__("wizard.tab.home")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab2">
                            <SVG ariaHidden svg={ShelfIcon} />
                            <h4>{__("wizard.tab.yourBooks")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab3">
                            <SVG ariaHidden svg={CatalogsIcon} />
                            <h4>{__("wizard.tab.catalogs")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab4">
                            <SVG ariaHidden svg={OpenBookIcon} />
                            <h4>{__("wizard.tab.readingView")}</h4>
                        </Tabs.Trigger>
                        <Tabs.Trigger value="tab5">
                            <SVG ariaHidden svg={AnnotationsIcon} />
                            <h4>{__("wizard.tab.annotations")}</h4>
                        </Tabs.Trigger>
                        <div style={{display: "flex", alignItems: "center", gap: "10px", position: "absolute", bottom: "30px", left: "30px"}}>
                            <input type="checkbox" checked={checked} onChange={() => setChecked(!checked)} id="wizardCheckbox" name="wizardCheckbox" />
                            <label htmlFor="wizardCheckbox">{__("wizard.dontShow")}</label>
                        </div>
                    </Tabs.List>
                    <div className={classNames(stylesSettings.settings_content, stylesModals.guidedTour_content)} style={{ marginTop: "70px" }}>
                        <Tabs.Content value="tab1" tabIndex={-1}>
                            <TabHeader title={""} />
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)}>
                                <h3>{__("wizard.title.welcome")}</h3>
                                <p>{__("wizard.description.home")}</p>
                                <img src={HomeImage} />
                                <div className={stylesModals.guidedTour_buttons}>
                                    <Dialog.Close className={stylesButtons.button_nav_primary}>
                                        <SVG ariaHidden svg={ShelfIcon} />
                                        {__("wizard.buttons.goToBooks")}
                                    </Dialog.Close>
                                    <Tabs.List>
                                        <Tabs.Trigger value="tab2" className={stylesButtons.button_primary_blue}>
                                            <SVG ariaHidden svg={ArrowRightIcon} />
                                            {__("wizard.buttons.discover")}
                                        </Tabs.Trigger>
                                    </Tabs.List>

                                </div>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab2" tabIndex={-1}>
                            <TabHeader title={""} />
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)}>
                                <h3>{__("wizard.title.allBooks")}</h3>
                                <p>
                                    {__("wizard.description.yourBooks")}
                                </p>
                                <img src={BooksImage} />
                                <div className={stylesModals.guidedTour_buttons}>
                                    <Tabs.List>
                                        <Tabs.Trigger value="tab3" className={stylesButtons.button_primary_blue}>
                                            <SVG ariaHidden svg={ArrowRightIcon} />
                                            {__("wizard.buttons.next")}
                                        </Tabs.Trigger>
                                    </Tabs.List>
                                </div>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab3" tabIndex={-1}>
                            <TabHeader title={""} />
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)}>
                                <h3>{__("wizard.tab.catalogs")}</h3>
                                <p>
                                    {__("wizard.description.catalogs")}
                                </p>
                                <img src={CatalogsImage} />
                                <div className={stylesModals.guidedTour_buttons}>
                                    <Tabs.List>
                                        <Tabs.Trigger value="tab4" className={stylesButtons.button_primary_blue} >
                                            <SVG ariaHidden svg={ArrowRightIcon} />
                                            {__("wizard.buttons.next")}
                                        </Tabs.Trigger>
                                    </Tabs.List>
                                </div>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab4" tabIndex={-1}>
                            <TabHeader title={""} />
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)}>
                                <h3>{__("wizard.tab.readingView")}</h3>
                                <p>
                                    {__("wizard.description.readingView1")}<br />{__("wizard.description.readingView2")}</p>
                                <img src={ReadingImage} />
                                <div className={stylesModals.guidedTour_buttons}>
                                    <Tabs.List>
                                        <Tabs.Trigger value="tab5" className={stylesButtons.button_primary_blue}>
                                            <SVG ariaHidden svg={ArrowRightIcon} />
                                            {__("wizard.buttons.next")}
                                        </Tabs.Trigger>
                                    </Tabs.List>
                                </div>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content value="tab5" tabIndex={-1}>
                            <TabHeader title={""} />
                            <div className={classNames(stylesSettings.settings_tab, stylesModals.guidedTour_tab)}>
                                <h3>{__("wizard.title.newFeature")}</h3>
                                <p>
                                    {__("wizard.description.annotations")}</p>
                                <img src={AnnotationsImage} />
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
                        <button className={stylesButtons.button_transparency_icon} aria-label="Close">
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                </div> */}
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
