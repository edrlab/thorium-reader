import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";


const DivinaSetReadingMode = (props: any) => {

    return (
        <div id={stylesReader.themes_list} aria-label={props.__("reader.settings.disposition.title")} role="radiogroup">
            <div>
                <input
                    disabled={!props.divinaReadingModeSupported.includes("double")}
                    id={"radio-" + "double"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        props.handleDivinaReadingMode("double");
                    }}
                    checked={props.divinaReadingMode === "double"}
                />
                <label
                    aria-disabled={!props.divinaReadingModeSupported.includes("double")}
                    htmlFor={"radio-" + "double"}
                >
                    {props.divinaReadingMode === "double" && <SVG svg={DoneIcon} ariaHidden />}
                    { "double" }
                </label>
            </div>
            <div>
                <input
                    disabled={!props.divinaReadingModeSupported.includes("guided")}
                    id={"radio-" + "guided"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        props.handleDivinaReadingMode("guided");
                    }}
                    checked={props.divinaReadingMode === "guided"}
                />
                <label
                    aria-disabled={!props.divinaReadingModeSupported.includes("guided")}
                    htmlFor={"radio-" + "guided"}
                >
                    {props.divinaReadingMode === "guided" && <SVG svg={DoneIcon} ariaHidden/>}
                    {"guided"}
                </label>
            </div>
            <div>
                <input
                    disabled={!props.divinaReadingModeSupported.includes("scroll")}
                    id={"radio-" + "scroll"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        props.handleDivinaReadingMode("scroll");
                    }}
                    checked={props.divinaReadingMode === "scroll"}
                />
                <label
                    aria-disabled={!props.divinaReadingModeSupported.includes("scroll")}
                    htmlFor={"radio-" + "scroll"}
                >
                    {props.divinaReadingMode === "scroll" && <SVG svg={DoneIcon} ariaHidden/>}
                    {"scroll"}
                </label>
            </div>
            <div>
                <input
                    disabled={!props.divinaReadingModeSupported.includes("single")}
                    id={"radio-" + "single"}
                    type="radio"
                    name="divinaReadingMode"
                    onChange={() => {
                        props.handleDivinaReadingMode("single");
                    }}
                    checked={props.divinaReadingMode === "single"}
                />
                <label
                    aria-disabled={!props.divinaReadingModeSupported.includes("single")}
                    htmlFor={"radio-" + "single"}
                >
                    {props.divinaReadingMode === "single" && <SVG svg={DoneIcon} ariaHidden />}
                    { "single" }
                </label>
            </div>
        </div>
    );
}

export default DivinaSetReadingMode;