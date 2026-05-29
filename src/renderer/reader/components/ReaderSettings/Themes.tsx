// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { TTheme } from "readium-desktop/common/models/reader";
import { useReaderConfig, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { RadioGroupItem } from "readium-desktop/renderer/reader/components/ReaderSettings/ReaderSettings";

export const Theme = ({ dockedMode }: { dockedMode: boolean }) => {
    const [__] = useTranslator();
    const theme = useReaderConfig("theme");
    const set = useSaveReaderConfigDebounced();

    const [themeOptions] = React.useState(() => [
        {
            id: 1,
            name: `${__("reader.settings.theme.name.Neutral")}`,
            value: "neutral",
            style: { backgroundColor: "#fefefe", color: "black" },
        },
        {
            id: 2,
            name: `${__("reader.settings.theme.name.Sepia")}`,
            value: "sepia",
            style: { backgroundColor: "#faf4e8", color: "black" },
        },
        {
            id: 3,
            name: `${__("reader.settings.theme.name.Night")}`,
            value: "night",
            style: { backgroundColor: "#121212", color: "#fff" },
        },
        {
            id: 4,
            name: `${__("reader.settings.theme.name.Paper")}`,
            value: "paper",
            style: { backgroundColor: "#E9DDC8", color: "#000000" },
        },
        {
            id: 5,
            name: `${__("reader.settings.theme.name.Contrast1")}`,
            value: "contrast1",
            style: { backgroundColor: "#000000", color: "#fff" },
        },
        {
            id: 6,
            name: `${__("reader.settings.theme.name.Contrast2")}`,
            value: "contrast2",
            style: { backgroundColor: "#000000", color: "#FFFF00" },
        },
        {
            id: 7,
            name: `${__("reader.settings.theme.name.Contrast3")}`,
            value: "contrast3",
            style: { backgroundColor: "#181842", color: "#FFFF" },
        },
        {
            id: 8,
            name: `${__("reader.settings.theme.name.Contrast4")}`,
            value: "contrast4",
            style: { backgroundColor: "#C5E7CD", color: "#000000" },
        },
    ]);


    const defaultKey =
        theme === "neutral" ? 1
            : theme === "night" ? 3
                : theme === "sepia" ? 2
                    : theme === "contrast1" ? 5
                        : theme === "paper" ? 4
                            : theme === "contrast2" ? 6
                                : theme === "contrast3" ? 7
                                    : theme === "contrast4" ? 8
                                        : 1;

    return (
        <section className={stylesSettings.section}>
            <h3>{__("reader.settings.theme.title")}</h3>
            <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: dockedMode ? "10px" : "20px", marginTop: "5px", flexWrap: "wrap" }}
                value={themeOptions.find((theme) => theme.id === defaultKey).value}
                onValueChange={(option) => set({ theme: option as TTheme })}
            >
                {themeOptions.map((theme) =>
                    <RadioGroupItem
                        key={theme.value}
                        value={theme.value}
                        description={theme.name}
                        className={stylesSettings.settings_theme_container}
                        style={theme.style}
                        svg={defaultKey === theme.id ? DoubleCheckIcon : null}
                    />,
                )}
                {/* <RadioGroupItem
                value="neutral"
                description={`${__("reader.settings.theme.name.Neutral")}`}
                className={stylesSettings.settings_theme_container}
                style={{backgroundColor: "#fff", color: "black"}}
                svg={defaultKey === 1 ? CheckIcon : null}
                />
                <RadioGroupItem
                value="sepia"
                description={`${__("reader.settings.theme.name.Sepia")}`}
                className={stylesSettings.settings_theme_container}
                style={{backgroundColor: "#faf4e8", color: "black"}}
                svg={defaultKey === 2 ? CheckIcon : null}
                />
                <RadioGroupItem
                value="night"
                description={`${__("reader.settings.theme.name.Night")}`}
                className={stylesSettings.settings_theme_container}
                style={{backgroundColor: "#2D2D2D", color: "#fff" }}
                svg={defaultKey === 3 ? CheckIcon : null}
                /> */}
            </RadioGroup.Root>
        </section>
    );
};
