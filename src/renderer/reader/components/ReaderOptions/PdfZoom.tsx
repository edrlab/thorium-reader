import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import { IPdfPlayerScale, IPdfPlayerView } from "../../pdf/common/pdfReader.type";

const PdfZoom = (props: any) => {
    const { __ } = props;

    const [pdfView, ] = React.useState<IPdfPlayerView | undefined>(undefined);
    const [pdfScale, ] = React.useState<IPdfPlayerScale | undefined>(undefined);

    const inputComponent = (scale: IPdfPlayerScale, disabled = false) => {
        return <div>
                <input
                    id={"radio-" + `${scale}`}
                    type="radio"
                    name="pdfZoomRadios"
                    onChange={() => props.pdfEventBus.dispatch("scale", scale)}
                    checked={pdfScale === scale}
                    disabled={disabled}
                />
                <label
                    aria-disabled={disabled}
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
            // TODO string inference typescript 4.1
    };

    return (
        <div id={stylesReader.themes_list} role="radiogroup" aria-label={__("reader.settings.pdfZoom.title")}>
            {inputComponent("page-fit")}
            {inputComponent("page-width", pdfView === "paginated")}
            {inputComponent(50, pdfView === "paginated")}
            {inputComponent(100, pdfView === "paginated")}
            {inputComponent(150, pdfView === "paginated")}
            {inputComponent(200, pdfView === "paginated")}
            {inputComponent(300, pdfView === "paginated")}
            {inputComponent(500, pdfView === "paginated")}
        </div>
    );
};

export default PdfZoom;