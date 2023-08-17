// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export type TMouseEventOnButton = React.MouseEvent<HTMLButtonElement, MouseEvent>;

export type TMouseEventOnInput = React.MouseEvent<HTMLInputElement, MouseEvent>;

export type TMouseEventOnSpan = React.MouseEvent<HTMLSpanElement, MouseEvent>;

export type TMouseEventOnAnchor = React.MouseEvent<HTMLAnchorElement, MouseEvent>;

export type TKeyboardEventOnAnchor = React.KeyboardEvent<HTMLAnchorElement>;

export type TKeyboardEventButton = React.KeyboardEvent<HTMLButtonElement>;

export type TFormEvent = React.FormEvent<HTMLFormElement>;

export type TChangeEventOnInput = React.ChangeEvent<HTMLInputElement>;

export type TChangeEventOnTextArea = React.ChangeEvent<HTMLTextAreaElement>;

export type TChangeEventOnSelect = React.ChangeEvent<HTMLSelectElement>;
