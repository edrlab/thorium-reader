import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";


enum themeType {
    Without,
    Sepia,
    Night,
}

const ThemeContent = (props: any) => {
    const {readerConfig } = props;
    const [ __ ] = useTranslator();
    const withoutTheme = !readerConfig.sepia && !readerConfig.night;

    const handleChooseTheme = (theme: themeType) => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        let sepia = false;
        let night = false;

        switch (theme) {
            case themeType.Night:
                night = true;
                break;
            case themeType.Sepia:
                sepia = true;
                break;
        }
        readerConfig.sepia = sepia;
        readerConfig.night = night;

        props.setSettings(readerConfig);
    }
      
    return (
        <div id={stylesReader.themes_list} role="radiogroup" aria-label={__("reader.settings.theme.title")}>
            <div>
                <input
                    id={"radio-" + themeType.Without}
                    type="radio"
                    name="theme"
                    onChange={() => handleChooseTheme(themeType.Without)}
                    checked={withoutTheme}
                />
                <label htmlFor={"radio-" + themeType.Without}>
                    {withoutTheme && <SVG svg={DoneIcon} ariaHidden />}
                    {__("reader.settings.theme.name.Neutral")}
                </label>
            </div>
            <div>
                <input
                    id={"radio-" + themeType.Sepia}
                    type="radio"
                    name="theme"
                    onChange={() => handleChooseTheme(themeType.Sepia)}
                    checked={readerConfig.sepia}
                />
                <label htmlFor={"radio-" + themeType.Sepia}>
                    {readerConfig.sepia && <SVG svg={DoneIcon} ariaHidden />}
                    {__("reader.settings.theme.name.Sepia")}
                </label>
            </div>
            <div>
                <input
                    id={"radio-" + themeType.Night}
                    type="radio"
                    name="theme"
                    onChange={() => handleChooseTheme(themeType.Night)}
                    checked={readerConfig.night}
                />
                <label htmlFor={"radio-" + themeType.Night}>
                    {readerConfig.night && <SVG svg={DoneIcon} ariaHidden />}
                    {__("reader.settings.theme.name.Night")}
                </label>
            </div>
        </div>
    );
};

export default ThemeContent;
