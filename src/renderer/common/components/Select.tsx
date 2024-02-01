// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Button, Select as SelectReactAria, Label, ListBox, ListBoxItem, Popover, SelectProps, ValidationResult, Group, SelectValue } from "react-aria-components";
import { FieldError, Text } from "react-aria-components";
import SVG, { ISVGProps } from "./SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import classNames from "classnames";

export interface MySelectProps<T extends object>
    extends Omit<SelectProps<T>, "children"> {
    label?: string;
    description?: string;
    errorMessage?: string | ((validation: ValidationResult) => string);
    items?: Iterable<T>;
    children: React.ReactNode | ((item: T) => React.ReactNode);
    svg?: ISVGProps;
    refButEl?: React.Ref<HTMLButtonElement>;
}

// export function Select2<T extends object>(
//     { label, description, errorMessage, children, svg, refInputEl, items, ...props }: MySelectProps<T>,
// ) {
//     return (
//         <SelectReactAria {...props}>
//             <Label className={StylesCombobox.react_aria_Label}>{label}</Label>
//             <Group className={classNames(StylesCombobox.my_combobox_container,"R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} >
//                 {svg ? <SVG ariaHidden svg={svg} /> : <></>}
//                 <Input className={classNames(StylesCombobox.react_aria_Input, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} />
//                 <Button className={StylesCombobox.react_aria_Button}>
//                     <SVG ariaHidden svg={ChevronDown} />
//                 </Button>
//             </Group>
//             {description ? <Text slot="description">{description}</Text> : <></>}
//             <FieldError>{errorMessage}</FieldError>
//             <Popover className={StylesCombobox.react_aria_Popover}>
//                 <ListBox className={StylesCombobox.react_aria_ListBox} items={items}>
//                     {children}
//                 </ListBox>
//             </Popover>
//         </SelectReactAria>
//     );
// }

export function Select<T extends object>(
    { label, description, errorMessage, children, svg, refButEl, items, ...props }: MySelectProps<T>,
  ) {
    return (
      <SelectReactAria {...props}  className={StylesCombobox.react_aria_ComboBox}>
        <Label className={StylesCombobox.react_aria_Label}>{label}</Label>
        <Group className={classNames(StylesCombobox.my_combobox_container, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} >
            {svg ? <SVG ariaHidden svg={svg} /> : <></>}
            <Button ref={refButEl} className={StylesCombobox.react_aria_Button}>
                <SelectValue />
                <SVG ariaHidden svg={ChevronDown} />
            </Button>
        </Group>
        {description && <Text slot="description">{description}</Text>}
        <FieldError>{errorMessage}</FieldError>
        <Popover className={StylesCombobox.react_aria_Popover}>
          <ListBox className={StylesCombobox.react_aria_ListBox} items={items}>
            {children}
          </ListBox>
        </Popover>
      </SelectReactAria>
    );
  }
  
export function SelectItem<T extends object>(props: T) {
    return (
        <ListBoxItem
            {...props}
            className={({ isFocused, isSelected }) =>
                classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
        />
    );
}
