import * as React from "react";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";

export interface IOption {
    id: string;
    onChange: () => void;
    svg: ISVGProps;
    description: string;
    checked: boolean;
    disabled: boolean;
    name: string;
    tabIndex: number
};

export type TOptions = Array<IOption>;

export const SettingsRadioBtnTemplate = (option: IOption) => {
    return <>
        <input id={option.id} type="radio" tabIndex={option.tabIndex} name={option.name} onChange={option.onChange} checked={option.checked} disabled={option.disabled} />
        <label className={stylesSettings.display_options_item} htmlFor={option.id}>
            <SVG ariaHidden svg={option.svg} />
            <p>{option.description}</p>
        </label>
    </>;
};
