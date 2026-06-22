// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";


export const ModalControlButtons = ({ dockedMode }: { dockedMode: boolean }) => {
    const [__] = useTranslator();
    const setReaderConfig = useSaveReaderConfig();

    const setDockingMode = (value: ReaderConfig["readerDockingMode"]) => {
        setReaderConfig({ readerDockingMode: value });
    };
    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");

    return (
        dockedMode ? <></> :
            <div key="modal-header" className={stylesSettings.close_button_div}>
                <div>
                    <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.dock.dockLeft")} onClick={setDockingModeLeftSide}>
                        <SVG ariaHidden={true} svg={DockLeftIcon} />
                    </button>
                    <button className={stylesButtons.button_transparency_icon} aria-label={__("reader.dock.dockRight")} onClick={setDockingModeRightSide}>
                        <SVG ariaHidden={true} svg={DockRightIcon} />
                    </button>
                    <button className={stylesButtons.button_transparency_icon} disabled aria-label={__("reader.dock.dockDefault")} onClick={setDockingModeFull}>
                        <SVG ariaHidden={true} svg={DockModalIcon} />
                    </button>
                    <Dialog.Close asChild>
                        <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                </div>
            </div>
    );
};
