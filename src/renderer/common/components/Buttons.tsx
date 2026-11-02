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
    primary: stylesButtons.button_primary_blue,
    secondary: stylesButtons.button_secondary_blue,
};

type IButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "className" | "title" | "aria-label"> & {
    label: string;
    variant?: ButtonVariant;
    svg?: ISVGProps;
    svgClassname?: string;
    extendedLabel?: string;
};

export const ThButton = React.forwardRef<HTMLButtonElement, IButtonProps>(
    ({ variant = "primary", extendedLabel, label, svg, svgClassname, ...props }, ref) => (
        <button
            {...props}
            ref={ref}
            title={extendedLabel || label}
            aria-label={extendedLabel || label}
            className={variantStyles[variant]}
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
