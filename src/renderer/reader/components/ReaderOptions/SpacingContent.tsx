import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import optionsValues from "../options-values";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

const SpacingContent= (props: any) => {
    const { readerConfig } = props;
    const [__] = useTranslator();

    const roundRemValue = (value: string | undefined) => {
        if (!value) {
            return "-";
        }
        // TODO: other potential CSS units?
        const nbr = parseFloat(value.replace("%", "").replace("rem", "").replace("em", "").replace("px", ""));
        const roundNumber = (Math.round(nbr * 100) / 100);
        return roundNumber ? roundNumber : " ";
    }

    return (<>
        <div className={stylesReader.line_tab_content}>
            <div id="label_pageMargins" className={stylesReader.subheading}>
                {__("reader.settings.margin")}
            </div>
            <input
                type="range"
                aria-labelledby="label_pageMargins"
                onChange={(e) => props.handleIndexChange(e, "pageMargins")}
                min={0}
                max={optionsValues.pageMargins.length - 1}
                value={props.indexes.pageMargins}
                step={1}
                aria-valuemin={0}
                aria-valuemax={optionsValues.pageMargins.length - 1}
                aria-valuenow={props.indexes.pageMargins}
            />
            <span className={stylesReader.reader_settings_value}>
                {roundRemValue(readerConfig.pageMargins)}
            </span>
        </div>
        <div className={stylesReader.line_tab_content}>
            <div id="label_wordSpacing" className={stylesReader.subheading}>
                {__("reader.settings.wordSpacing")}
            </div>
            <input
                type="range"
                aria-labelledby="label_wordSpacing"
                onChange={(e) => props.handleIndexChange(e, "wordSpacing")}
                min={0}
                max={optionsValues.wordSpacing.length - 1}
                value={props.indexes.wordSpacing}
                step={1}
                aria-valuemin={0}
                aria-valuemax={optionsValues.wordSpacing.length - 1}
                aria-valuenow={props.indexes.wordSpacing}
            />
            <span className={stylesReader.reader_settings_value}>
                {roundRemValue(readerConfig.wordSpacing)}
            </span>
        </div>
        <div className={stylesReader.line_tab_content}>
            <div id="label_letterSpacing" className={stylesReader.subheading}>
                {__("reader.settings.letterSpacing")}
            </div>
            <input
                type="range"
                aria-labelledby="label_letterSpacing"
                onChange={(e) => props.handleIndexChange(e, "letterSpacing")}
                min={0}
                max={optionsValues.letterSpacing.length - 1}
                value={props.indexes.letterSpacing}
                step={1}
                aria-valuemin={0}
                aria-valuemax={optionsValues.letterSpacing.length - 1}
                aria-valuenow={props.indexes.letterSpacing}
            />
            <span className={stylesReader.reader_settings_value}>
                {roundRemValue(readerConfig.letterSpacing)}
            </span>
        </div>
        <div className={stylesReader.line_tab_content}>
            <div id="label_paraSpacing" className={stylesReader.subheading}>
                {__("reader.settings.paraSpacing")}
            </div>
            <input
                type="range"
                aria-labelledby="label_paraSpacing"
                onChange={(e) => props.handleIndexChange(e, "paraSpacing")}
                min={0}
                max={optionsValues.paraSpacing.length - 1}
                value={props.indexes.paraSpacing}
                step={1}
                aria-valuemin={0}
                aria-valuemax={optionsValues.paraSpacing.length - 1}
                aria-valuenow={props.indexes.paraSpacing}
            />
            <span className={stylesReader.reader_settings_value}>
                {roundRemValue(readerConfig.paraSpacing)}
            </span>
        </div>
        <div className={stylesReader.line_tab_content}>
            <div id="label_lineHeight" className={stylesReader.subheading}>
                {__("reader.settings.lineSpacing")}
            </div>
            <input
                type="range"
                aria-labelledby="label_lineHeight"
                onChange={(e) => props.handleIndexChange(e, "lineHeight")}
                min={0}
                max={optionsValues.lineHeight.length - 1}
                value={props.indexes.lineHeight}
                step={1}
                aria-valuemin={0}
                aria-valuemax={optionsValues.lineHeight.length - 1}
                aria-valuenow={props.indexes.lineHeight}
            />
            <span className={stylesReader.reader_settings_value}>
                {roundRemValue(readerConfig.lineHeight)}
            </span>
        </div>
    </>);
};

export default SpacingContent;
