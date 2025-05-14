import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as Popover from "@radix-ui/react-popover";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSpinner from "readium-desktop/renderer/assets/styles/components/spinnerContainer.scss";

import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerActions } from "readium-desktop/common/redux/actions";
import { getStore } from "../createStore";

// VibeCoded on labs.perplexity.ai with R1 :-)
function parsePrintRanges(input: string) {
    const segmentRegex = /^\s*(\d+)\s*$|^\s*(\d*)\s*-\s*(\d*)\s*$/;
    return input.split(";").map(segment => {
      const trimmed = segment.trim();
      if (!trimmed) return null;
      
      const match = segmentRegex.exec(trimmed);
      if (!match) return null;
  
      // Single number case (e.g., "1")
      if (match[1] !== undefined) {
        const num = parseInt(match[1], 10);
        return [num, num];
      }
  
      // Range case (e.g., "1-4", "2-", "-9")
      const start = match[2] ? parseInt(match[2], 10) : null;
      const end = match[3] ? parseInt(match[3], 10) : null;
      
      // Handle invalid case where both start and end are missing ("-")
      return (start === null && end === null) ? null : [start, end];
    }).filter(Boolean); // Remove any null/invalid entries
}

function convertRangestoNumberArray(ranges: number[][], pdfPageRange: [start: number, end: number]): Array<number> {
    const set = new Set<number>();;
    for (const range of ranges) {

        if (range) {

            if (range[0] < pdfPageRange[0]) {
                range[0] = pdfPageRange[0];
            }
            if (range[1] > pdfPageRange[1]) {
                range[1] = pdfPageRange[1];
            }
            if (!range[0]) {
                range[0] = pdfPageRange[0];
            }
            if (!range[1]) {
                range[1] = pdfPageRange[1];
            }

            let i = range[0];
            while (i <= range[1]) {
                set.add(i++);
            }
        }
    }

    return [...set];
}

export const PrintContainer = ({ pdfPageRange, pdfThumbnailImageCacheArray }: { pdfPageRange: [start: number, end: number], pdfThumbnailImageCacheArray: string[] }) => {

    const [getV, setV] = React.useState(`${pdfPageRange[0]}-${pdfPageRange[1]}`);
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const pageRange = React.useMemo(() => convertRangestoNumberArray(parsePrintRanges(getV), pdfPageRange), [getV, pdfPageRange]);

    return <>
        <style>{`
             .print-popover-form {
            background-color: var(--color-extralight-grey);
            max-width: 450px;
            border-radius: 6px;
            border: 1px solid var(--color-light-grey);
            display: flex;
            flex-direction: column;
            padding: 5px 10px;
            color: var(--color-primary);
            min-width: 450px;
            min-height: 400px;
        }

        .print-popover-image-container {
            display: flex; /* Use flexbox to align images horizontally */
            flex-wrap: nowrap; /* Prevent images from wrapping to a new line */
            overflow-x: auto; /* Add horizontal scrollbar */
            overflow-y: hidden; /* Hide vertical scrollbar */
            padding: 10px; /* Optional padding */
            min-width: 430px;
            min-height: 210px;
        }

        .print-popover-image-container img {
            width: 155px;
            height: 200px;
        }

        .print-popover-page-icon {
            position: relative;
        }

        .print-popover-page-icon::after {
            content: '';
            width: 1.2em;
            height: 1.2em;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' stroke='%23007bff' stroke-width='2' fill='none'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23007bff'%3E?%3C/text%3E%3C/svg%3E");
            background-size: contain;
            position: absolute;
            right: -40px;
            top: -5px;
        }
        `}</style>
        <form className="print-popover-form">
            <h4>{__("reader.print.print")}</h4>

            <div className="print-popover-image-container">
                {pageRange.map((pageNumber) =>
                    pdfThumbnailImageCacheArray[pageNumber - 1]
                        ? <img key={pageNumber} src={pdfThumbnailImageCacheArray[pageNumber - 1]} title={(pageNumber).toString()} />
                        : (<div key={pageNumber} style={{position: "relative", backgroundColor: "inherit"}} className={stylesSpinner.spinner_container}><div className={stylesSpinner.spinner}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>),
                )}
            </div>

            <div className={stylesInput.form_group} style={{ marginTop: "20px", width: "360px" }}>
                <input type="text" name="print-range" style={{ width: "100%", marginLeft: "10px" }} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" title={"print-range"} value={getV} onChange={(e) => {
                    const v = e.target.value;
                    setV(v);
                }} />
                <label htmlFor="print-range">{__("reader.print.ranges")}</label>
                <div className="print-popover-page-icon" title={pageRange.toString()}></div>
            </div>

            <div className={stylesAnnotations.annotation_form_textarea_buttons}>
                <Popover.Close className={stylesButtons.button_secondary_blue} aria-label={__("dialog.cancel")}>{__("dialog.cancel")}</Popover.Close>
                <Popover.Close
                    type="submit"
                    className={stylesButtons.button_primary_blue}
                    aria-label={__("reader.print.print")}
                    onClick={(_e) => {
                        // e.preventDefault();
                        // createOrGetPdfEventBus().dispatch("print", pageRange);
                        
                        const publicationIdentifier = getStore().getState().reader.info.publicationIdentifier;
                        dispatch(readerActions.print.build(publicationIdentifier, pageRange)); // send to main process
                    }}
                >
                    {__("reader.print.print")}
                </Popover.Close>
            </div>
        </form>
    </>;
};
