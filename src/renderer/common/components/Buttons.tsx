// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import SVG, { ISVGProps } from "./SVG";


type ButtonVariant = "primary" | "secondary";

const variantStyles: Record<ButtonVariant, string> = {
    primary: stylesButtons.button_primary,
    secondary: stylesButtons.button_secondary,
};

interface IButtonProps {
    label: string;
    variant?: ButtonVariant;
    id?: string;
    tabIndex?: number;
    type?: "button" | "reset" | "submit";
    svg?: ISVGProps;
    svgClassname?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    extendedLabel?: string;
    style?: React.CSSProperties;
    dir?: "rtl" | "ltr";
    ref?: React.Ref<HTMLButtonElement>;
}

export const ThButton = React.forwardRef<HTMLButtonElement, IButtonProps>(
    ({ variant = "primary", type, extendedLabel, label, svg, svgClassname, onClick, onFocus, disabled, style, id, tabIndex, dir }, ref) => (
        <button
            ref={ref}
            id={id}
            type={type}
            tabIndex={tabIndex}
            dir={dir}
            title={extendedLabel || label}
            aria-label={extendedLabel || label}
            className={variantStyles[variant]}
            onClick={onClick}
            onFocus={onFocus}
            disabled={disabled}
            style={style}
        >
            {svg && <SVG ariaHidden svg={svg} className={svgClassname} />}
            <span>{label}</span>
        </button>
    ),
);

ThButton.displayName = "ThButton";

export const ThButtonPrimary = React.forwardRef<HTMLButtonElement, IButtonProps>((props, ref) => <ThButton {...props} ref={ref} variant="primary" />);
ThButtonPrimary.displayName = "ThButtonPrimary";

export const ThButtonSecondary = React.forwardRef<HTMLButtonElement, IButtonProps>((props, ref) => <ThButton {...props} ref={ref} variant="secondary" />);
ThButtonSecondary.displayName = "ThButtonSecondary";
