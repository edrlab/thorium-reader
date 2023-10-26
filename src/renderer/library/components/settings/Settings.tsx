// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";

import AuthSettings from "./AuthSettings";
import KeyboardSettings from "./KeyboardSettings";
import LanguageSettings from "./LanguageSettings";
import SessionSettings from "./SessionSettings";
import { DialogCloseButton, DialogHeader, DialogTitle, DialogWithRadix, DialogWithRadixContent, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import * as GearIcon from "readium-desktop/renderer/assets/icons/settings.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as Tabs from "@radix-ui/react-tabs";


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

class Settings extends React.Component<IProps, undefined> {

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <LibraryLayout
                    title={__("header.settings")}
                >
                    <DialogWithRadix>
                        <DialogWithRadixTrigger asChild>
                            <button
                                className={stylesButtons.button_transparency_icon}
                                style={{border: "none"}}
                            >
                                <SVG ariaHidden={true} svg={GearIcon} />
                            </button>
                        </DialogWithRadixTrigger>
                        <DialogWithRadixContent>
                            <DialogHeader>
                                <DialogTitle>
                                {__("header.settings")}
                                </DialogTitle>
                                <div>
                                    <DialogCloseButton />
                                </div>
                            </DialogHeader>
                                <Tabs.Root defaultValue="tab1" data-orientation="vertical" className={stylesSettings.settings_container}>
                                    <Tabs.List className={stylesSettings.settings_tabslist} data-orientation="vertical" aria-orientation="vertical">
                                        <Tabs.Trigger value="tab1">General</Tabs.Trigger>
                                        <Tabs.Trigger value="tab2">Appearence</Tabs.Trigger>
                                        <Tabs.Trigger value="tab3">Reading</Tabs.Trigger>
                                        <Tabs.Trigger value="tab4">Keyboard Shortcuts</Tabs.Trigger>
                                    </Tabs.List>
                                    <div style={{flex: "2"}}>
                                        <Tabs.Content value="tab1">
                                            <LanguageSettings></LanguageSettings>
                                        </Tabs.Content>
                                        <Tabs.Content value="tab2">
                                            <AuthSettings></AuthSettings>
                                        </Tabs.Content>
                                        <Tabs.Content value="tab3">
                                            <SessionSettings></SessionSettings>
                                        </Tabs.Content>
                                        <Tabs.Content value="tab4">
                                            <KeyboardSettings></KeyboardSettings>
                                        </Tabs.Content>
                                    </div>
                                </Tabs.Root>
                        </DialogWithRadixContent>
                    </DialogWithRadix>
                </LibraryLayout>
            </>
        );
    }
}

export default withTranslator(Settings);
