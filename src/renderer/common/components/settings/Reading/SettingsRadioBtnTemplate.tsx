import * as React from "react";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import * as RadioGroup from "@radix-ui/react-radio-group";

export interface IOption {
    value: string;
    svg: ISVGProps;
    description: string;
    disabled: boolean;
};

export type TOptions = Array<IOption>;

export const SettingsRadioBtnTemplate = (option: IOption) => {
    return (
        <RadioGroup.Item value={option.value} id={option.value} className={stylesSettings.display_options_item} disabled={option.disabled}>
            <SVG ariaHidden svg={option.svg} />
            {option.description}
        </RadioGroup.Item>
    );
};
