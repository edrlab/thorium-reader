// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Select from "@radix-ui/react-select";
import { withTranslator} from "readium-desktop/renderer/common/components/hoc/translator";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { AvailableThemes } from "readium-desktop/common/services/translator";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";

// import * as stylesThemes from "readium-desktop/renderer/assets/styles/components/themes.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as PaintBrushIcon from "readium-desktop/renderer/assets/icons/paintbrush-icon.svg";

import { ObjectKeys } from "readium-desktop/utils/object-keys-values";


interface AvailableThemes {
    neutral: string,
    night: string,
    auto: string,
}

const SelectItem = React.forwardRef(({ children, ...props }: any, forwardedRef) => {
    return (
        <Select.Item {...props} id="itemInner" ref={forwardedRef}
        className={stylesSettings.select_item}>
            <Select.ItemText>{children}</Select.ItemText>
            <Select.ItemIndicator className={stylesSettings.select_icon}>
                <SVG svg={DoneIcon} ariaHidden/>
            </Select.ItemIndicator>
        </Select.Item>
    );
});

SelectItem.displayName = "SelectItem";

const Themes = (props: any) => {
    const [ __ ] = useTranslator();
    const currentTheme: keyof AvailableThemes = props.locale;
    return (
        <section className={stylesSettings.settings_tab_container}>
            <div className={stylesGlobal.heading}>
                <h4>{__("reader.settings.theme.title")}</h4>
            </div>
            <Select.Root>
                <Select.Trigger className={stylesSettings.select_trigger}>
                    <div>
                    <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={PaintBrushIcon} /></Select.Icon>
                        <Select.Value placeholder={AvailableThemes[currentTheme]} />
                    </div>
                    <Select.Icon className={stylesSettings.select_icon}><SVG ariaHidden={true} svg={ChevronDown} /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content className={stylesSettings.select_content} position="popper" sideOffset={10} sticky="always">
                        <Select.Viewport role="select">
                        { ObjectKeys(AvailableThemes).map((theme, i) =>
                            <SelectItem value={theme} key={i}>{ AvailableThemes[theme] }</SelectItem>,
                        )}
                        </Select.Viewport>
                    </Select.Content>
                    </Select.Portal>
            </Select.Root>
        </section>
    );
};


export default (withTranslator(Themes));
