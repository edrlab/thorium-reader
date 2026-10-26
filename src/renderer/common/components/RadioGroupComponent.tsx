// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==
import * as React from "react";
import {
  RadioGroup as AriaRadioGroup,
  Radio as AriaRadio,
  Label,
  Text,
  FieldError,
  type RadioGroupProps as AriaRadioGroupProps,
  type ValidationResult,
  type RadioProps as AriaRadioProps,
} from "react-aria-components";
import SVG, { ISVGProps } from "./SVG";

export interface RadioGroupProps extends Omit<AriaRadioGroupProps, "children" | "onChange"> {
  children?: React.ReactNode;
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  onValueChange?: (value: string) => void;
}

export function RadioGroup({
  label,
  description,
  errorMessage,
  onValueChange,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup {...props} onChange={onValueChange}>
      {label && <Label>{label}</Label>}
      {children}
      {description && <Text slot="description">{description}</Text>}
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </AriaRadioGroup>
  );
}

export interface RadioProps extends Omit<AriaRadioProps, "children" | "isDisabled"> {
  description: string;
  svg?: ISVGProps;
  disabled?: boolean;
}

export function Radio({ description, svg, disabled, ...props }: RadioProps) {
  return (
    <AriaRadio {...props} isDisabled={disabled}>
      {svg && <SVG ariaHidden svg={svg} />}
      <span>{description}</span>
    </AriaRadio>
  );
}
