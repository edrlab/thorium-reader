// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as DockLeftIcon from "readium-desktop/renderer/assets/icons/dockleft-icon.svg";
import * as DockRightIcon from "readium-desktop/renderer/assets/icons/dockright-icon.svg";
import * as DockModalIcon from "readium-desktop/renderer/assets/icons/dockmodal-icon.svg";
import { useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

interface DockedHeaderProps {
    dockedMode: boolean;
    dockingMode: ReaderConfig["readerDockingMode"];
    isEpub: boolean;
    setSection: (value: string) => void;
    dockedModeRef: React.RefObject<HTMLButtonElement>;
    options: { id: number, value: string, name: string, disabled: boolean, svg: {} }[];
    optionSelected: number;
    optionDisabled?: number[];
    section: string;
    allowCustomContainer?: () => JSX.Element;
}

interface SelectRefProps {
    isEpub: boolean,
    setSection: (value: string) => void,
    dockedMode: boolean,
    dockedModeRef: React.RefObject<HTMLButtonElement>,
    options: {
        id: number,
        value: string,
        name: string,
        disabled: boolean,
        svg: ISVGProps,
    }[],
    optionSelected: number,
    optionDisabled: number[],
    section: string
}

const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: string, name: string, disabled: boolean, svg: {} }>>((props, forwardedRef) => <Select refButEl={forwardedRef} {...props}></Select>);
SelectRef.displayName = "ComboBox";

const SelectRefComponent = ({ isEpub, setSection, dockedMode, dockedModeRef, options, optionSelected, optionDisabled, section }: SelectRefProps) => {
    return (
        <SelectRef
            id="reader-settings-nav"
            items={options}
            selectedKey={optionSelected}
            disabledKeys={optionDisabled}
            svg={options.find(({ value }) => value === section)?.svg}
            onSelectionChange={(id) => {
                // console.log("selectionchange: ", id);
                const value = options.find(({ id: _id }) => _id === id)?.value;
                if (value) {
                    setSection(value);
                    setTimeout(() => {
                        // TODO: is stealing focus here necessary? Should this vary depending on keyboard or mouse interaction?
                        const elem = document.getElementById(`readerSettings_tabs-${value}`);
                        elem?.blur();
                        elem?.focus();
                    }, 1);
                    // console.log("set Tab Value = ", value);
                } else {
                    // console.error("Combobox No value !!!");
                }
            }}
            // onInputChange={(v) => {
            //     console.log("inputchange: ", v);

            //     const value = options.find(({ name }) => name === v)?.value;
            //     if (value) {
            //         setTabValue(value);
            //         console.log("set Tab Value = ", value);

            //     } else {
            //         console.error("Combobox No value !!!");
            //     }
            // }}
            style={{ margin: "0", padding: (dockedMode && isEpub) ? "10px 0" : "0", flexDirection: "row", backgroundColor: "var(--color-header-docked)" }}
            ref={dockedModeRef}
        >
            {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
        </SelectRef>
    );
};

export const DockedHeader = ({ dockedMode, dockingMode, isEpub, setSection, dockedModeRef, options, optionSelected, optionDisabled, section, allowCustomContainer }: DockedHeaderProps) => {

    const setReaderConfig = useSaveReaderConfig();
    const setDockingMode = (value: ReaderConfig["readerDockingMode"]) => {
        setReaderConfig({ readerDockingMode: value });
    };
    const setDockingModeFull = () => setDockingMode("full");
    const setDockingModeLeftSide = () => setDockingMode("left");
    const setDockingModeRightSide = () => setDockingMode("right");


    const [__] = useTranslator();

    const showAllowCustom = dockedMode && isEpub && allowCustomContainer;
    const selectRef = <SelectRefComponent key="select-ref" isEpub={isEpub} setSection={setSection} dockedMode={dockedMode} dockedModeRef={dockedModeRef} options={options} optionSelected={optionSelected} optionDisabled={optionDisabled} section={section} />;
    return (
        <>
            <div key="docked-header" className={stylesPopoverDialog.docked_header}>
                {showAllowCustom ? allowCustomContainer() : selectRef}
                <div key="docked-header-btn" className={stylesPopoverDialog.docked_header_controls}>
                    <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "left"} aria-label={__("reader.dock.dockLeft")} onClick={setDockingModeLeftSide}>
                        <SVG ariaHidden={true} svg={DockLeftIcon} />
                    </button>
                    <button className={stylesButtons.button_transparency_icon} disabled={dockingMode === "right"} aria-label={__("reader.dock.dockRight")} onClick={setDockingModeRightSide}>
                        <SVG ariaHidden={true} svg={DockRightIcon} />
                    </button>
                    <button className={stylesButtons.button_transparency_icon} disabled={false} aria-label={__("reader.dock.dockDefault")} onClick={setDockingModeFull}>
                        <SVG ariaHidden={true} svg={DockModalIcon} />
                    </button>

                    <Dialog.Close asChild>
                        <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                </div>
            </div>
            {showAllowCustom ? selectRef : <></>}
        </>
    );
};
