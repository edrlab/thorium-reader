// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import os from "node:os";
import * as React from "react";
import { TKeyboardShortcut } from "readium-desktop/common/keyboard";
import * as MacCmdIcon from "readium-desktop/renderer/assets/icons/maccommand-icon.svg";
import * as MacOptionIcon from "readium-desktop/renderer/assets/icons/macoption-icon.svg";
import * as ShiftIcon from "readium-desktop/renderer/assets/icons/shift-icon.svg";
import * as WindowsIcon from "readium-desktop/renderer/assets/icons/windows-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { applyKeyboardLayoutMap, toUpperIfSimpleLowerCase } from "readium-desktop/renderer/common/keyboard";

const _isMac = os.platform() === "darwin";
const _isWindows = os.platform() === "win32";
// const isLinux = !isMac && !isWindows;
const DETECTED_OS: "Windows" | "MacOS" | "Linux" = _isWindows ? "Windows" : _isMac ? "MacOS" : "Linux";

export const PrettifyKeyboardShortcut: React.FC<{ def: TKeyboardShortcut }> = ({ def }) => {
    const alt = def.alt ? <span title={DETECTED_OS === "MacOS" ? "Option" : "Alt"}>{DETECTED_OS === "MacOS" ? <SVG ariaHidden svg={MacOptionIcon} /> : "ALT"} </span> : null;
    const shift = def.shift ? <span title="Shift"><SVG ariaHidden svg={ShiftIcon} /> </span> : null;
    const control = def.control ? <span title="Control">CTRL </span> : null;
    const meta = def.meta ? <span title={DETECTED_OS === "MacOS" ? "Command" : "Meta"}>{DETECTED_OS === "MacOS" ? <SVG ariaHidden svg={MacCmdIcon} /> : <SVG ariaHidden svg={WindowsIcon} />} </span> : null;
    const softKeyRaw = applyKeyboardLayoutMap(def.key);
    const softKey = toUpperIfSimpleLowerCase(softKeyRaw);
    return <span aria-hidden>{shift}{control}{alt}{meta} <span> {softKey}</span></span>;
};
