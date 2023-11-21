import classNames from "classnames";
import { colCountEnum, textAlignEnum } from "r2-navigator-js/dist/es8-es2017/src/electron/common/readium-css-settings";
import * as React from "react";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as AutoIcon from "readium-desktop/renderer/assets/icons/auto.svg";
import * as ColumnIcon from "readium-desktop/renderer/assets/icons/colonne.svg";
import * as Column2Icon from "readium-desktop/renderer/assets/icons/colonne2.svg";
import * as DefileIcon from "readium-desktop/renderer/assets/icons/defile.svg";
import * as PageIcon from "readium-desktop/renderer/assets/icons/page.svg";
import * as JustifyIcon from "readium-desktop/renderer/assets/icons/justifie.svg";
import * as StartIcon from "readium-desktop/renderer/assets/icons/gauche.svg";
import * as PagineIcon from "readium-desktop/renderer/assets/icons/pagine.svg";
import { IPdfPlayerColumn, IPdfPlayerView } from "../../pdf/common/pdfReader.type";
import { TChangeEventOnInput, TChangeEventOnSelect } from "readium-desktop/typings/react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

// interface IState {
//     pdfScale: IPdfPlayerScale | undefined;
//     pdfView: IPdfPlayerView | undefined;
//     pdfCol: IPdfPlayerColumn | undefined;
// }

interface DisplayContentProps {
    readerConfig: ReaderConfig;
    handleSettingChange: (event: TChangeEventOnInput | TChangeEventOnSelect, name: keyof ReaderConfig, value?: string | boolean) => void;
    setSettings: (config: ReaderConfig) => void;
}

const DisplayContent: React.FC<DisplayContentProps> = (props: any) => {
    const { readerConfig, isPdf } = props;
    const [__] = useTranslator();
    const [pdfView, setPdfView] = React.useState<IPdfPlayerView | undefined>(undefined);
    const [pdfCol, setPdfCol] = React.useState<IPdfPlayerColumn | undefined>(undefined);


    const toggleMathJax = () => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        readerConfig.enableMathJax = !readerConfig.enableMathJax;
        if (readerConfig.enableMathJax) {
            readerConfig.paged = false;
        }
        props.setSettings(readerConfig);
        setPdfView(readerConfig.enableMathJax ? "scrolled" : "paginated");
    };

    const toggleReduceMotion = () => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        readerConfig.reduceMotion = !readerConfig.reduceMotion;
        props.setSettings(readerConfig);
        setPdfCol(readerConfig.reduceMotion ? "1" : "2");
    };

    const toggleNoFootnotes = () => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        readerConfig.noFootnotes = !readerConfig.noFootnotes;
        props.setSettings(readerConfig);
    };

    const getButtonClassName = (
        propertyName: keyof ReaderConfig,
        value: string | boolean,
        additionalClassName?: string): string => {

        const property = props.readerConfig[propertyName];
        let classname = "";
        if (property === value) {
            classname = stylesReader.active;
        } else {
            classname = stylesReader.notUsed;
        }
        return classNames(classname, additionalClassName);
    };

    const getButtonClassNamePdf = (
        test: boolean,
        additionalClassName?: string): string => {

        let classname = "";
        if (test) {
            classname = stylesReader.active;
        } else {
            classname = stylesReader.notUsed;
        }
        return classNames(classname, additionalClassName);
    };

    return <>
        {
            isPdf
                ? <></>
                :
                <div className={stylesReader.line_tab_content}>
                    <div id="label_disposition" className={stylesReader.subheading}>{__("reader.settings.disposition.title")}</div>
                    <div className={stylesReader.center_in_tab} role="radiogroup" aria-labelledby="label_disposition">
                        <div className={stylesReader.focus_element}>
                            <input
                                id={stylesReader.scroll_option}
                                type="radio"
                                name="disposition"
                                onChange={(e) => isPdf
                                    ? props.pdfEventBus.dispatch("view", "scrolled")
                                    : props.handleSettingChange(e, "paged", false)}
                                checked={isPdf
                                    ? pdfView === "scrolled"
                                    : !readerConfig.paged}
                            />
                            <label
                                htmlFor={stylesReader.scroll_option}
                                className={isPdf
                                    ? getButtonClassNamePdf(pdfView === "scrolled")
                                    : getButtonClassName("paged", false)}
                            >
                                <SVG ariaHidden={true} svg={DefileIcon} />
                                {__("reader.settings.scrolled")}
                            </label>
                        </div>
                        <div className={stylesReader.focus_element}>
                            <input
                                id={stylesReader.page_option}
                                type="radio"
                                name="disposition"
                                onChange={(e) => isPdf
                                    ? props.pdfEventBus.dispatch("view", "paginated")
                                    : props.handleSettingChange(e, "paged", true)}
                                checked={isPdf
                                    ? pdfView === "paginated"
                                    : readerConfig.paged}
                            />
                            <label
                                htmlFor={stylesReader.page_option}
                                className={isPdf
                                    ? getButtonClassNamePdf(pdfView === "paginated")
                                    : getButtonClassName("paged", true)}
                            >
                                <SVG ariaHidden={true} svg={PagineIcon} />
                                {__("reader.settings.paginated")}
                            </label>
                        </div>
                    </div>
                </div>
        }
        <div className={stylesReader.line_tab_content} hidden={props.isPdf}>
            <div id="label_justification" className={stylesReader.subheading}>{__("reader.settings.justification")}</div>
            <div className={stylesReader.center_in_tab} role="radiogroup" aria-labelledby="label_justification">
                <div className={stylesReader.focus_element}>
                    <input
                        id={"radio-" + stylesReader.option_auto}
                        name="alignment"
                        type="radio"
                        onChange={(e) => props.handleSettingChange(e, "align", "auto")}
                        checked={readerConfig.align === "auto"}
                    />
                    <label
                        htmlFor={"radio-" + stylesReader.option_auto}
                        className={getButtonClassName("align", "auto")}
                    >
                        <SVG ariaHidden={true} svg={PageIcon} />
                        {__("reader.settings.column.auto")}
                    </label>
                </div>
                <div className={stylesReader.focus_element}>
                    <input
                        id={"radio-" + stylesReader.option_justif}
                        name="alignment"
                        type="radio"
                        onChange={(e) => props.handleSettingChange(e, "align", textAlignEnum.justify)}
                        checked={readerConfig.align === textAlignEnum.justify}
                    />
                    <label
                        htmlFor={"radio-" + stylesReader.option_justif}
                        className={getButtonClassName("align", "justify")}
                    >
                        <SVG ariaHidden={true} svg={JustifyIcon} />
                        {__("reader.settings.justify")}
                    </label>
                </div>
                <div className={stylesReader.focus_element}>
                    <input
                        id={"radio-" + stylesReader.option_start}
                        name="alignment"
                        type="radio"
                        onChange={(e) => props.handleSettingChange(e, "align", textAlignEnum.start)}
                        checked={readerConfig.align === textAlignEnum.start}
                    />
                    <label
                        htmlFor={"radio-" + stylesReader.option_start}
                        className={getButtonClassName("align", "start")}
                    >
                        <SVG ariaHidden={true} svg={StartIcon} />
                        {`< ${__("reader.svg.left")} ${__("reader.svg.right")} >`}
                    </label>
                </div>
            </div>
        </div>
        <div className={stylesReader.line_tab_content}>
            <div id="label_column" className={stylesReader.subheading}>{__("reader.settings.column.title")}</div>
            <div className={stylesReader.center_in_tab} role="radiogroup" aria-labelledby="label_column">
                {
                    isPdf
                        ? <></>
                        : <div className={stylesReader.focus_element}>
                            <input
                                id={"radio-" + stylesReader.option_colonne}
                                type="radio"
                                name="column"
                                {...(!readerConfig.paged && { disabled: true })}
                                onChange={(e) => isPdf
                                    ? props.pdfEventBus.dispatch("column", "auto")
                                    : props.handleSettingChange(e, "colCount", colCountEnum.auto)}
                                checked={isPdf
                                    ? pdfCol === "auto"
                                    : readerConfig.colCount === colCountEnum.auto}
                            />
                            <label
                                htmlFor={"radio-" + stylesReader.option_colonne}
                                className={isPdf
                                    ? getButtonClassNamePdf(pdfCol === "auto")
                                    : getButtonClassName("colCount",
                                        !readerConfig.paged ? null : colCountEnum.auto,
                                        !readerConfig.paged && stylesReader.disable)}
                            >
                                <SVG ariaHidden={true} svg={AutoIcon} />
                                {__("reader.settings.column.auto")}
                            </label>
                        </div>
                }
                <div className={stylesReader.focus_element}>
                    <input
                        disabled={!isPdf && !readerConfig.paged ? true : false}
                        id={"radio-" + stylesReader.option_colonne1}
                        type="radio"
                        name="column"
                        onChange={(e) => isPdf
                            ? props.pdfEventBus.dispatch("column", "1")
                            : props.handleSettingChange(e, "colCount", colCountEnum.one)}
                        checked={isPdf
                            ? pdfCol === "1"
                            : readerConfig.colCount === colCountEnum.one}
                    />
                    <label
                        htmlFor={"radio-" + stylesReader.option_colonne1}
                        className={isPdf
                            ? getButtonClassNamePdf(pdfCol === "1")
                            : getButtonClassName("colCount",
                                !readerConfig.paged ? null : colCountEnum.one,
                                !readerConfig.paged && stylesReader.disable)}
                    >
                        <SVG svg={ColumnIcon} title={__("reader.settings.column.oneTitle")} />
                        {__("reader.settings.column.one")}
                    </label>
                </div>
                <div className={stylesReader.focus_element}>
                    <input
                        id={"radio-" + stylesReader.option_colonne2}
                        type="radio"
                        name="column"
                        disabled={!isPdf && !readerConfig.paged ? true : false}
                        onChange={(e) => isPdf
                            ? props.pdfEventBus.dispatch("column", "2")
                            : props.handleSettingChange(e, "colCount", colCountEnum.two)}
                        checked={isPdf
                            ? pdfCol === "2"
                            : readerConfig.colCount === colCountEnum.two}
                    />
                    <label
                        htmlFor={"radio-" + stylesReader.option_colonne2}
                        className={isPdf
                            ? getButtonClassNamePdf(pdfCol === "2")
                            : getButtonClassName("colCount",
                                !readerConfig.paged ? null : colCountEnum.two,
                                !readerConfig.paged && stylesReader.disable)
                        }
                    >
                        <SVG svg={Column2Icon} title={__("reader.settings.column.twoTitle")} />
                        {__("reader.settings.column.two")}
                    </label>
                </div>
            </div>
        </div>
        <div className={stylesReader.line_tab_content} hidden={props.isPdf}>
            <div className={stylesReader.mathml_section}>
                <input
                    id="mathJaxCheckBox"
                    type="checkbox"
                    checked={readerConfig.enableMathJax}
                    onChange={() => toggleMathJax()}
                />
                <label htmlFor="mathJaxCheckBox">MathJax</label>
            </div>
            <div className={stylesReader.mathml_section}>
                <input
                    id="reduceMotionCheckBox"
                    type="checkbox"
                    checked={readerConfig.reduceMotion}
                    onChange={() => toggleReduceMotion()}
                />
                <label htmlFor="reduceMotionCheckBox">{__("reader.settings.reduceMotion")}</label>
            </div>

            <div className={stylesReader.mathml_section}>
                <input
                    id="noFootnotesCheckBox"
                    type="checkbox"
                    checked={readerConfig.noFootnotes}
                    onChange={() => toggleNoFootnotes()}
                />
                <label htmlFor="noFootnotesCheckBox">{__("reader.settings.noFootnotes")}</label>
            </div>
        </div>
    </>;
};

export default DisplayContent;
