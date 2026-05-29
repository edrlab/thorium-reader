// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";

import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as TwoColsIcon from "readium-desktop/renderer/assets/icons/2cols-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as DefaultPageIcon from "readium-desktop/renderer/assets/icons/defaultPage-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { createOrGetPdfEventBus } from "readium-desktop/renderer/reader/pdf/driver";
import { useReaderConfig, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { IReaderSettingsProps } from "readium-desktop/renderer/reader/components/options-values";
import { IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView } from "readium-desktop/renderer/reader/pdf/common/pdfReader.type";
import { RadioGroupItem } from "readium-desktop/renderer/reader/components/ReaderSettings/ReaderSettings";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends IReaderSettingsProps {
    // handleSettingsClick: (open: boolean) => void;

    // tabValue: string;
    // setTabValue: (value: string) => void;
}

interface IState {
    pdfScale?: IPdfPlayerScale | undefined;
    pdfView?: IPdfPlayerView | undefined;
    pdfCol?: IPdfPlayerColumn | undefined;
    spreadModeEven?: boolean | undefined;
}

export const ReadingDisplayCol = ({ isPdf, spreadModeEven, pdfCol }: Pick<IBaseProps, "isPdf"> & Pick<IState, "spreadModeEven"> & Pick<IState, "pdfCol">) => {
    const [__] = useTranslator();

    const paged = useReaderConfig("paged");
    const colCount = useReaderConfig("colCount");
    const set = useSaveReaderConfigDebounced();
    const scrollable = !paged;

    const [state, setState] = React.useState(scrollable ? "auto" : colCount);
    React.useEffect(() => {
        if (scrollable) {
            setState("auto");
        } else {
            setState(colCount);
        }
    }, [scrollable, colCount]);

    // console.log("ReadingDisplayCol spreadModeEven", spreadModeEven);
    // console.log("ReadingDisplayCol pdfCol", pdfCol);
    return (
        <section className={stylesSettings.section}>
            <div>
                <h3>{__("reader.settings.column.title")}</h3>
            </div>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px" }} value={isPdf ? (pdfCol ? pdfCol : "1") : state}
                    onValueChange={(v) => {
                        if (isPdf) {
                            createOrGetPdfEventBus().dispatch("column", v === "auto" ? "1" : v === "1" ? "1" : "2");
                        } else {
                            set({ colCount: v });
                        }
                    }}
                >
                    {isPdf ? <></> : <RadioGroupItem value="auto" description={`${__("reader.settings.column.auto")}`} svg={DefaultPageIcon} disabled={false} />}
                    <RadioGroupItem value="1" description={`${__("reader.settings.column.one")}`} svg={AlignJustifyIcon} disabled={isPdf ? false : scrollable} />
                    <RadioGroupItem value="2" description={`${__("reader.settings.column.two")}`} svg={TwoColsIcon} disabled={isPdf ? false : scrollable} />
                </RadioGroup.Root>
            </div>
            {!isPdf || pdfCol === "auto" || pdfCol === "1" /* disabled={pdfCol === "auto" || pdfCol === "1"} */
                ? <></> :
                <div className={stylesSettings.display_options}>
                    <input type="checkbox"
                        checked={!!spreadModeEven}
                        onChange={() => { createOrGetPdfEventBus().dispatch("spreadModeEven", !(!!spreadModeEven)); }}
                        id="spreadModeEvenCheckbox" name="spreadModeEvenCheckbox" className={stylesGlobal.checkbox_custom_input} />
                    {/* label htmlFor clicked with mouse cursor causes onChange() of input (which is display:none), but keyboard interaction (tab stop and space bar toggle) occurs with the div role="checkbox" below! (onChange is not called, only onKeyUp) */}
                    <label htmlFor="spreadModeEvenCheckbox" className={stylesGlobal.checkbox_custom_label}>
                        <div
                            tabIndex={0}
                            role="checkbox"
                            aria-checked={!!spreadModeEven}
                            aria-label={__("reader.settings.spreadModeEven")}
                            onKeyDown={(e) => {
                                // if (e.code === "Space") {
                                if (e.key === " ") {
                                    e.preventDefault(); // prevent scroll
                                }
                            }}
                            onKeyUp={(e) => {
                                // Includes screen reader tests:
                                // if (e.code === "Space") { WORKS
                                // if (e.key === "Space") { DOES NOT WORK
                                // if (e.key === "Enter") { WORKS
                                if (e.key === " ") { // WORKS
                                    e.preventDefault();
                                    createOrGetPdfEventBus().dispatch("spreadModeEven", !(!!spreadModeEven));
                                }
                            }}
                            className={stylesGlobal.checkbox_custom}
                            style={{ border: !!spreadModeEven ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: !!spreadModeEven ? "var(--color-brand-primary)" : "transparent" }}>
                            {!!spreadModeEven ?
                                <SVG ariaHidden svg={CheckIcon} className={stylesGlobal.checkbox_customsvg} />
                                :
                                <></>
                            }
                        </div>
                        <span aria-hidden>
                            {__("reader.settings.spreadModeEven")}
                        </span>
                    </label>
                </div>
            }
        </section>
    );
};
