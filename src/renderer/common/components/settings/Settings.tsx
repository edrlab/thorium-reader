// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
// import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import KeyboardSettings from "./KeyboardSettings";
import LanguageSettings from "./LanguageSettings";
import Themes from "./Themes";
import { DialogCloseButton, DialogWithRadix, DialogWithRadixContent, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as GearIcon from "readium-desktop/renderer/assets/icons/settings.svg";
import * as CogIcon from "readium-desktop/renderer/assets/icons/cog-icon.svg";
import * as PaletteIcon from "readium-desktop/renderer/assets/icons/palette-icon.svg";
import * as ReadingIcon from "readium-desktop/renderer/assets/icons/reading-icon.svg";
import * as KeyReturnIcon from "readium-desktop/renderer/assets/icons/keyreturn-icon.svg";
import ReadingOptions from "./ReadingOptions";
import ConnectionSettings from "./Connection";






// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

const TabTitle = (props: any) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{props.title}</h2>
        </div>
    );
};

class Settings extends React.Component<IProps, undefined> {

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <DialogWithRadix>
                <DialogWithRadixTrigger asChild>
                    <button
                        className={stylesButtons.button_transparency_icon}
                        style={{ border: "none", marginRight: "60px" }}
                    >
                        <SVG ariaHidden={true} svg={GearIcon} />
                    </button>
                </DialogWithRadixTrigger>
                <DialogWithRadixContent>
                    <Tabs.Root defaultValue="tab1" data-orientation="vertical" orientation="vertical" className={stylesSettings.settings_container}>
                        <Tabs.List className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                            <Tabs.Trigger value="tab1">
                                <SVG ariaHidden svg={CogIcon} />
                                <h4>{__("settings.tabs.general")}</h4>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="tab2">
                                <SVG ariaHidden svg={PaletteIcon} />
                                <h4>{__("settings.tabs.appearance")}</h4>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="tab3">
                                <SVG ariaHidden svg={ReadingIcon} />
                                <h4>{__("settings.tabs.reading")}</h4>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="tab4">
                                <SVG ariaHidden svg={KeyReturnIcon} />
                                <h4>{__("settings.tabs.keyboardShortcuts")}</h4>
                            </Tabs.Trigger>
                        </Tabs.List>
                        <div className={stylesSettings.settings_content}>
                            <div className={stylesSettings.close_button_div}>
                                <DialogCloseButton />
                            </div>
                            <Tabs.Content value="tab1" title="General" tabIndex={-1}>
                                <TabTitle title={__("settings.tabs.general")} />
                                <section className={stylesSettings.settings_tab}>
                                    <LanguageSettings />
                                    <ConnectionSettings />
                                </section>
                            </Tabs.Content>
                            <Tabs.Content value="tab2" tabIndex={-1}>
                                <TabTitle title={__("settings.tabs.appearance")} />
                                <section className={stylesSettings.settings_tab}>
                                    <Themes />
                                </section>
                            </Tabs.Content>
                            <Tabs.Content value="tab3" tabIndex={-1}>
                                <TabTitle title={__("settings.tabs.reading")} />
                                <ReadingOptions />
                            </Tabs.Content>
                            <Tabs.Content value="tab4" tabIndex={-1}>
                                <TabTitle title={__("settings.tabs.keyboardShortcuts")} />
                                <KeyboardSettings />
                            </Tabs.Content>
                        </div>
                    </Tabs.Root>
                </DialogWithRadixContent>
            </DialogWithRadix>
        );
    }
}

export default withTranslator(Settings);
