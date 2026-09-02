// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as ScrollableIcon from "readium-desktop/renderer/assets/icons/scroll-icon.svg";
import * as PaginatedIcon from "readium-desktop/renderer/assets/icons/page-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useReaderConfig, useSaveReaderConfigDebounced } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { RadioGroupItem } from "readium-desktop/renderer/reader/components/ReaderSettings/ReaderSettings";

export const ReadingDisplayLayout = ({ isFXL }: { isFXL: boolean }) => {
    const [__] = useTranslator();
    const layout = useReaderConfig("paged");
    const set = useSaveReaderConfigDebounced();
    return (
        <div className={stylesSettings.section}>
            <h3>{__("reader.settings.disposition.title")}</h3>
            <div className={stylesSettings.display_options}>
                <RadioGroup.Root orientation="horizontal" style={{ display: "flex", gap: "10px" }} value={(layout || isFXL) ? "page_option" : "scroll_option"}
                    onValueChange={(v) => set({ paged: v === "page_option" })}
                >
                    <RadioGroupItem value="scroll_option" description={`${__("reader.settings.scrolled")}`} svg={ScrollableIcon} disabled={isFXL} />
                    <RadioGroupItem value="page_option" description={`${__("reader.settings.paginated")}`} svg={PaginatedIcon} disabled={false} />
                </RadioGroup.Root>
            </div>
        </div>
    );
};
