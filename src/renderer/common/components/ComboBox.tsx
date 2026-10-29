// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import classNames from "classnames";
import * as React from "react";
import { Focusable, TooltipTriggerProps } from "react-aria";
import { Button, ComboBox as ComboBoxReactAria, FieldError, Group, Input, Label, ListBox, ListBoxItem, Popover, Text, TooltipTrigger, ValidationResult } from "react-aria-components";
import { TKeyboardShortcut } from "readium-desktop/common/keyboard";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { textualizeKeyboardShortcut } from "readium-desktop/renderer/common/keyboard";
import { OVERLAY_Z_INDEX } from "./overlayHelpers";
import SVG, { ISVGProps } from "./SVG";
import { ToolTippy } from "./Tooltippy";

type TComboBoxReactAriaProps<T extends object> = Parameters<typeof ComboBoxReactAria<T>>[0];
export interface MyComboBoxProps_ {
    label?: string;
    tooltipkeyboardShortcuts?: TKeyboardShortcut[];
    tooltipkeyboardShortcutsNames?: string[];
    tooltipkeyboardShortcutsDescriptions?: string[];
}
export interface MyComboBoxProps<T extends object>
    extends Omit<TComboBoxReactAriaProps<T>, "children">, MyComboBoxProps_ {
    children: Parameters<typeof ListBox<T>>[0]["children"];

    description?: string | null;
    errorMessage?: string | ((validation: ValidationResult) => string);
    svg?: ISVGProps;
    refInputEl?: React.Ref<HTMLInputElement>;
    placeholder?: string;
    customWidth?: number;
    inputId?: string;
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

// //  & AriaTooltipProps & TooltipProps
// const MyTooltip: React.FC<React.PropsWithChildren<{ state: TooltipTriggerState } & DOMAttributes<FocusableElement> & MyComboBoxProps_>> = ({ tooltipkeyboardShortcuts, tooltipkeyboardShortcutsNames, tooltipkeyboardShortcutsDescriptions, state, ...props }) => {
//
//     const { tooltipProps } = useTooltip(props, state);
//
//     // return <Tooltip {...mergeProps(props, tooltipProps)} aria-hidden placement="bottom" offset={0} className={classNames("tooltipKeyboardShortcut")}>
//
//     return (
//         <div
//             style={{
//             position: "absolute",
//             left: "5px",
//             top: "100%",
//             maxWidth: 150,
//             marginTop: "10px",
//             backgroundColor: "white",
//             color: "black",
//             padding: "5px",
//             border: "1px solid gray",
//             }}
//             aria-hidden
//             className={classNames("tooltipKeyboardShortcut")}
//             {...mergeProps(props, tooltipProps)}>
//
//         <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>
//         {tooltipkeyboardShortcuts?.length ? <>
//             {
//                 tooltipkeyboardShortcuts.map((tooltipkeyboardShortcut, i) => {
//                     return <div key={`tooltipkeyboardShortcuts_${i}`}>
//                         <p><PrettifyKeyboardShortcut hideFromScreenReaders={false} def={tooltipkeyboardShortcut} /></p>
//                         {
//                             (tooltipkeyboardShortcutsNames?.[i] ? (<p>{tooltipkeyboardShortcutsNames?.[i]}</p>) : (<></>))
//                         }{
//                             (tooltipkeyboardShortcutsDescriptions?.[i] ? (<p>{tooltipkeyboardShortcutsDescriptions?.[i]}</p>) : (<></>))
//                         }
//                     </div>;
//                 })
//             }</>
//             : <></>}
//         </div >);
//
//     // </Tooltip>;
// };

const ToolTipButton: React.FC<React.PropsWithChildren<TooltipTriggerProps & MyComboBoxProps_>> = (props) => {

    const { tooltipkeyboardShortcuts, tooltipkeyboardShortcutsNames, tooltipkeyboardShortcutsDescriptions, label, ...otherProps } = props;

//     const state = useTooltipTriggerState(otherProps);
//     const ref = React.useRef(null);
//
//     const { triggerProps, tooltipProps } = useTooltipTrigger(otherProps, state, ref);

// const [isOpen, setOpen] = React.useState(false);
//     isOpen={isOpen}
//     onOpenChange={setOpen}
//
//     return <>
//     <button
//         ref={ref}
//         {...triggerProps}
//         onClick={() => {
//             state.open(true);
//         }}
//         style={{ width: "15px", height: "15px", float: "right", marginRight: "10px" }}
//         aria-label={label + tooltipkeyboardShortcuts.reduce((prev, cur, i) => (prev + " // " +
//             `[${textualizeKeyboardShortcut(cur)}]` +
//             (tooltipkeyboardShortcutsNames?.[i] ? ` (${tooltipkeyboardShortcutsNames?.[i]})` : "") +
//             (tooltipkeyboardShortcutsDescriptions?.[i] ? ` <${tooltipkeyboardShortcutsDescriptions?.[i]}>` : "")
//         ), "")}>
//         {props.children}
//     </button>
//     {state.isOpen ?
//     <MyTooltip
//         tooltipkeyboardShortcuts={tooltipkeyboardShortcuts}
//         tooltipkeyboardShortcutsNames={tooltipkeyboardShortcutsNames}
//         tooltipkeyboardShortcutsDescriptions={tooltipkeyboardShortcutsDescriptions}
//         state={state}
//         {...tooltipProps}
//     />
//     : <></>}</>;

    const [isOpen, setIsOpen] = React.useState(false);

    return <TooltipTrigger
        {...otherProps}
        delay={0}
        closeDelay={0}
        trigger="hover"
        isOpen={isOpen}
        onOpenChange={setIsOpen}>
        <Focusable>
            <button
                onClick={() => {
                    // document.querySelector(".tooltipKeyboardShortcut")?.classList.add("immediate");
                    setIsOpen(true);
                }}
                style={{ width: "15px", height: "15px", float: "right", marginRight: "10px" }}
                aria-label={label + tooltipkeyboardShortcuts.reduce((prev, cur, i) => (prev + " // " +
                    `[${textualizeKeyboardShortcut(cur)}]` +
                    (tooltipkeyboardShortcutsNames?.[i] ? ` (${tooltipkeyboardShortcutsNames?.[i]})` : "") +
                    (tooltipkeyboardShortcutsDescriptions?.[i] ? ` <${tooltipkeyboardShortcutsDescriptions?.[i]}>` : "")
                ), "")}
            >
                {props.children}
            </button>
        </Focusable>
        <ToolTippy
            placement="bottom"
            label={ label }
            tooltipkeyboardShortcuts={tooltipkeyboardShortcuts}
            tooltipkeyboardShortcutsNames={tooltipkeyboardShortcutsNames}
            tooltipkeyboardShortcutsDescriptions={tooltipkeyboardShortcutsDescriptions} />
    </TooltipTrigger>;
};

export function ComboBox<T extends object>(
    { inputId, label, description, errorMessage, children, svg, refInputEl, placeholder, customWidth, tooltipkeyboardShortcuts, tooltipkeyboardShortcutsNames, tooltipkeyboardShortcutsDescriptions, ...props }: MyComboBoxProps<T>,
) {

    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);

    //  dir={isRTL ? "rtl" : "ltr"} BREAKS ReactARIA ComboBox
    return (
        <ComboBoxReactAria {...props} className={StylesCombobox.react_aria_ComboBox} style={{width: customWidth ? `${customWidth + 20}px` : ""}}>
            {
                label ?
                    tooltipkeyboardShortcuts?.length ?
                    <div style={{width: customWidth ? `${customWidth}px` : ""}}>
                    <Label dir={isRTL ? "rtl" : "ltr"} className={StylesCombobox.react_aria_Label}>{label}</Label>
                    <ToolTipButton
                    tooltipkeyboardShortcuts={tooltipkeyboardShortcuts}
                    tooltipkeyboardShortcutsNames={tooltipkeyboardShortcutsNames}
                    tooltipkeyboardShortcutsDescriptions={tooltipkeyboardShortcutsDescriptions}
                    label={ label }
                    >
                    <SVG ariaHidden svg={InfoIcon} />
                    </ToolTipButton>
                    </div>
                    :
                    <Label dir={isRTL ? "rtl" : "ltr"} className={StylesCombobox.react_aria_Label}>{label}</Label>
                    : <></>
            }
            <Group className={classNames(StylesCombobox.my_combobox_container, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} style={{width: customWidth ? `${customWidth}px` : ""}}>
                {svg ? <SVG ariaHidden svg={svg} /> : <></>}
                <Input id={inputId} className={classNames(StylesCombobox.react_aria_Input, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} ref={refInputEl} placeholder={placeholder} />
                {(!props.defaultItems || !!Array(...(props.defaultItems || [])).length) &&
                    <Button className={StylesCombobox.react_aria_Button} style={{width: "unset"}}>
                        <SVG ariaHidden svg={ChevronDown} />
                    </Button>}
            </Group>
            {description ? <Text slot="description">{description}</Text> : <></>}
            <FieldError>{errorMessage}</FieldError>
            <Popover className={StylesCombobox.react_aria_Popover} style={{ zIndex: OVERLAY_Z_INDEX + 1 }}>
                <ListBox className={StylesCombobox.react_aria_ListBox}>
                    {children}
                </ListBox>
            </Popover>
        </ComboBoxReactAria>
    );
}

export function ComboBoxItem<T extends object>(props: Parameters<typeof ListBoxItem<T>>[0]) {
    // // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    // const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    // const isRTL = langStringIsRTL(locale);
    // dir={isRTL ? "rtl" : "ltr"}
    return (
        <ListBoxItem
            {...props}
            className={({ isFocused, isSelected }) =>
                classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
        />
    );
}
