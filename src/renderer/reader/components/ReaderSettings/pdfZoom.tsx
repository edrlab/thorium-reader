// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import { IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView } from "src/renderer/reader/pdf/common/pdfReader.type";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

interface IState {
    pdfScale?: IPdfPlayerScale | undefined;
    pdfView?: IPdfPlayerView| undefined;
    pdfCol?: IPdfPlayerColumn | undefined;
    spreadModeEven?: boolean | undefined;
}
import { createOrGetPdfEventBus } from "../../pdf/driver";

export const PdfZoom = ({ pdfScale /*, pdfView*/ }: Pick<IState, "pdfScale" | "pdfView">) => {
    const [__] = useTranslator();

    const inputComponent = (scale: IPdfPlayerScale/*, disabled = false*/) => {
        return <div>
            <input
                id={"radio-" + `${scale}`}
                type="radio"
                name="pdfZoomRadios"
                onChange={() => createOrGetPdfEventBus().dispatch("scale", scale)}
                checked={pdfScale === scale}
                // disabled={disabled}
            />
            <label
                // aria-disabled={disabled}
                htmlFor={"radio-" + `${scale}`}
            >
                {pdfScale === scale && <SVG svg={DoneIcon} ariaHidden />}
                {
                    scale === 50 ? __("reader.settings.pdfZoom.name.50pct") :
                        (scale === 100 ? __("reader.settings.pdfZoom.name.100pct") :
                            (scale === 150 ? __("reader.settings.pdfZoom.name.150pct") :
                                (scale === 200 ? __("reader.settings.pdfZoom.name.200pct") :
                                    (scale === 300 ? __("reader.settings.pdfZoom.name.300pct") :
                                        (scale === 500 ? __("reader.settings.pdfZoom.name.500pct") :
                                            (scale === "page-fit" ? __("reader.settings.pdfZoom.name.fit") :
                                                (scale === "page-width" ? __("reader.settings.pdfZoom.name.width") : "Zoom ??!")))))))
                    // --("reader.settings.pdfZoom.name." + scale as any)
                }
            </label>
        </div>;
    };

    return (
        <div id={stylesReader.themes_list} role="radiogroup" aria-label={__("reader.settings.pdfZoom.title")}>
            {inputComponent("page-fit")}
            {inputComponent("page-width" /* pdfView === "paginated"*/)}
            {inputComponent(50 /* pdfView === "paginated"*/)}
            {inputComponent(100 /* pdfView === "paginated"*/)}
            {inputComponent(150 /* pdfView === "paginated"*/)}
            {inputComponent(200 /* pdfView === "paginated"*/)}
            {inputComponent(300 /* pdfView === "paginated"*/)}
            {inputComponent(500 /* pdfView === "paginated"*/)}
        </div>
    );
};
