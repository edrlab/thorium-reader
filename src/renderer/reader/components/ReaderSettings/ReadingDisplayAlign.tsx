// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import * as DefaultPageIcon from "readium-desktop/renderer/assets/icons/defaultPage-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useReaderConfig, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { RadioGroupItem } from "readium-desktop/renderer/reader/components/ReaderSettings/ReaderSettings";

export const ReadingDisplayAlign = () => {
    const [__] = useTranslator();

    const align = useReaderConfig("align");
    const set = useSaveReaderConfigDebounced();

    return (
        <section className={stylesSettings.section}>
            <div>
                <h3>{__("reader.settings.justification")}</h3>
            </div>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px" }} value={align}
                    onValueChange={(v) => set({ align: v })}
                >
                    <RadioGroupItem value="auto" description={`${__("reader.settings.column.auto")}`} svg={DefaultPageIcon} disabled={false} />
                    <RadioGroupItem value="justify" description={`${__("reader.settings.justify")}`} svg={AlignJustifyIcon} disabled={false} />
                    <RadioGroupItem value="start" description={`${__("reader.svg.left")}`} svg={AlignLeftIcon} disabled={false} />
                </RadioGroup.Root>
            </div>
        </section>
    );
};
