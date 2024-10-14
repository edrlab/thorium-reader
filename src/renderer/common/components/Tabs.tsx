// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as React from "react";
import { Tabs, TabList, Tab } from "react-aria-components";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useTranslator } from "../hooks/useTranslator";
import * as Dialog from "@radix-ui/react-dialog";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";



const TabTitle = (props: React.PropsWithChildren<{title: string}>) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{props.title}</h2>
            {props.children}
        </div>
    );
};

export const TabHeader = (props: React.PropsWithChildren<{title: string, dockingModeActions?: any, dockedMode?: boolean, disabled?: boolean}>) => {
    const [__] = useTranslator();
    return (
        props.dockedMode ? <></> :
            <div key="modal-header" className={stylesSettings.close_button_div}>
                <TabTitle title={props.title}>
                    {props.children}
                </TabTitle>
                {props.dockingModeActions ?
                    <div>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.svg.left")} onClick={props.dockingModeActions.setDockingModeLeftSide}>
                            <SVG ariaHidden={true} svg={DockLeftIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.svg.right")} onClick={props.dockingModeActions.setDockingModeRightSide}>
                            <SVG ariaHidden={true} svg={DockRightIcon} />
                        </button>
                        <button className={stylesButtons.button_transparency_icon} disabled aria-label={__("reader.settings.column.auto")} onClick={props.dockingModeActions.setDockingModeFull}>
                            <SVG ariaHidden={true} svg={DockModalIcon} />
                        </button>
                        <Dialog.Close asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    :
                    <Dialog.Close asChild>
                        <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                }
            </div>
    );
};

export const TabsComponent = (props: React.PropsWithChildren<{tabs: {id: string, title?: string, svg?: typeof import("*.svg"), disabled?: boolean, component?: React.JSX.Element}[], selectedKey?: any, defaultSelectedKey?: any, dockedMode?: boolean, additionnal?: any, additionnalPosition?: number}>) => {

    const [__] = useTranslator();

    return (
        <Tabs orientation="vertical" className={stylesSettings.settings_container} selectedKey={props.selectedKey} defaultSelectedKey={props.defaultSelectedKey}>
            { props.dockedMode ? <></> :
            <TabList items={props.tabs} className={stylesSettings.settings_tabslist}>
                {item => <Tab id={item.id} isDisabled={item.disabled}>
                    {item.svg ? 
                        <SVG ariaHidden svg={item.svg} />
                        : <></>
                    }
                        {item.component ? item.component : 
                        <h4>{item.title}</h4>
                        }
                        {item.disabled ? <i>{__("reader.settings.disabled")}</i> : <></>}
                    </Tab>}
            </TabList>
            }
            <div className={stylesSettings.settings_content} style={{marginTop: "70px"}}>
                {props.children}
            </div>
        </Tabs>
    );
};
