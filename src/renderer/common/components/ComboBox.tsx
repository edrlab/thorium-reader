// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Button, ComboBox as ComboBoxReactAria, Input, Label, ListBox, ListBoxItem, Popover, ComboBoxProps, ListBoxItemProps, ValidationResult } from "react-aria-components";
import { FieldError, Text } from "react-aria-components";
import SVG, { ISVGProps } from "./SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import classNames from "classnames";

interface MyComboBoxProps<T extends object>
  extends Omit<ComboBoxProps<T>, "children"> {
  label?: string;
  description?: string | null;
  errorMessage?: string | ((validation: ValidationResult) => string);
  children: React.ReactNode | ((item: T) => React.ReactNode);
  svg?: ISVGProps;
}

export function ComboBox<T extends object>(
  { label, description, errorMessage, children, svg, ...props }: MyComboBoxProps<T>,
) {
  return (
    <ComboBoxReactAria {...props} className={StylesCombobox.react_aria_ComboBox}>
    <Label className={StylesCombobox.react_aria_Label}>{label}</Label>
    <div className={StylesCombobox.my_combobox_container}>
        {svg ? <SVG ariaHidden svg={svg} /> : <></>}
        <Input className={StylesCombobox.react_aria_Input} />
        <Button className={StylesCombobox.react_aria_Button}>
        <SVG ariaHidden svg={ChevronDown} />
        </Button>
    </div>
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

export function ComboBoxItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
    {...props}
    className={({ isFocused, isSelected }) =>
        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
    />
  );
}
