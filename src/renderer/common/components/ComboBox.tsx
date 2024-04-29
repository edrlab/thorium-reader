// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Button, ComboBox as ComboBoxReactAria, Input, Label, ListBox, ListBoxItem, Popover, ComboBoxProps, ValidationResult, Group } from "react-aria-components";
import { FieldError, Text } from "react-aria-components";
import SVG, { ISVGProps } from "./SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import classNames from "classnames";

export interface MyComboBoxProps<T extends {}>
    extends Omit<ComboBoxProps<T>, "children"> {
    label?: string;
    description?: string | null;
    errorMessage?: string | ((validation: ValidationResult) => string);
    children: React.ReactNode | ((item: T) => React.ReactNode);
    svg?: ISVGProps;
    refInputEl?: React.Ref<HTMLInputElement>;
}

// function forwardRef<T extends object>(
//     render: React.ForwardRefRenderFunction<HTMLDivElement, MyComboBoxProps<T>>,
// ): React.ForwardRefExoticComponent<React.PropsWithoutRef<MyComboBoxProps<T>> & React.RefAttributes<HTMLDivElement>> {
//     return React.forwardRef(render);
// }

// export const ComboBox = forwardRef<any>(
//     ({ children, label, svg, description, errorMessage, ...props }, forwardedRef) => (
//         <ComboBoxReactAria {...props} className={StylesCombobox.react_aria_ComboBox}>
//             <Label className={StylesCombobox.react_aria_Label}>{label}</Label>
//             <div className={StylesCombobox.my_combobox_container} ref={forwardedRef}>
//                 {svg ? <SVG ariaHidden svg={svg} /> : <></>}
//                 <Input className={classNames(StylesCombobox.react_aria_Input, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} />
//                 <Button className={StylesCombobox.react_aria_Button}>
//                     <SVG ariaHidden svg={ChevronDown} />
//                 </Button>
//             </div>
//             {description ? <Text slot="description">{description}</Text> : <></>}
//             <FieldError>{errorMessage}</FieldError>
//             <Popover className={StylesCombobox.react_aria_Popover}>
//                 <ListBox className={StylesCombobox.react_aria_ListBox}>
//                     {children}
//                 </ListBox>
//             </Popover>
//         </ComboBoxReactAria>
//     )
// );

export function ComboBox<T extends object>(
    { label, description, errorMessage, children, svg, refInputEl, ...props }: MyComboBoxProps<T>,
) {
    return (
        <ComboBoxReactAria {...props} className={StylesCombobox.react_aria_ComboBox}>
            <Label className={StylesCombobox.react_aria_Label}>{label}</Label>
            <Group className={classNames(StylesCombobox.my_combobox_container,"R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} >
                {svg ? <SVG ariaHidden svg={svg} /> : <></>}
                <Input className={classNames(StylesCombobox.react_aria_Input, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} ref={refInputEl}/>
                <Button className={StylesCombobox.react_aria_Button}>
                    <SVG ariaHidden svg={ChevronDown} />
                </Button>
            </Group>
            {description ? <Text slot="description">{description}</Text> : <></>}
            <FieldError>{errorMessage}</FieldError>
            <Popover className={StylesCombobox.react_aria_Popover}>
                <ListBox className={StylesCombobox.react_aria_ListBox}>
                    {children}
                </ListBox>
            </Popover>
        </ComboBoxReactAria>
    );
}

export function ComboBoxItem<T extends object>(props: T) {
    return (
        <ListBoxItem
            {...props}
            className={({ isFocused, isSelected }) =>
                classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
        />
    );
}
