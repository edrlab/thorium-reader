// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Font } from "readium-desktop/common/models/font";
import fontList from "readium-desktop/utils/fontList";

import * as AutoIcon from "readium-desktop/renderer/assets/icons/auto.svg";
import * as ColumnIcon from "readium-desktop/renderer/assets/icons/colonne.svg";
import * as Column2Icon from "readium-desktop/renderer/assets/icons/colonne2.svg";
import * as DefileIcon from "readium-desktop/renderer/assets/icons/defile.svg";
import * as LeftIcon from "readium-desktop/renderer/assets/icons/gauche.svg";
import * as JustifyIcon from "readium-desktop/renderer/assets/icons/justifie.svg";
import * as PagineIcon from "readium-desktop/renderer/assets/icons/pagine.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { colCountEnum } from "@r2-navigator-js/electron/common/readium-css-settings";

import optionsValues from "./options-values";

import classNames = require("classnames");

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";
import { SectionData } from "./sideMenu/sideMenuData";

import SideMenu from "./sideMenu/SideMenu";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";

interface Props extends TranslatorProps {
    open: boolean;
    settings: any;
    indexes: {fontSize: number, pageMargins: number, wordSpacing: number, letterSpacing: number, lineHeight: number};
    handleSettingChange: (event: any, name: string, value?: any) => void;
    handleIndexChange: (event: any, name: string, value?: any) => void;
    setSettings: (settings: any) => void;
    toggleMenu: any;
}

enum themeType {
    Without,
    Sepia,
    Night,
}

export class ReaderOptions extends React.Component<Props> {
    private sectionRefList: any = [];

    public constructor(props: Props) {
        super(props);

        this.handleChooseTheme = this.handleChooseTheme.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, settings, toggleMenu } = this.props;

        if (!settings) {
            return <></>;
        }

        const sections: SectionData[] = [
            {
                title: __("reader.settings.theme.title"),
                content: this.themeContent(),
            },
            {
                title: __("reader.settings.text"),
                content: this.textContent(),
            },
            {
                title: __("reader.settings.display"),
                content: this.displayContent(),
            },
            {
                title: __("reader.settings.spacing"),
                content: this.spacingContent(),
            },
        ];

        return (
            <SideMenu
                className={styles.read_settings}
                listClassName={styles.read_settings_list}
                open={this.props.open}
                sections={sections}
                toggleMenu={toggleMenu}
            />
        );
    }

    private themeContent() {
        const {__} = this.props;

        return (
            <>
                <div ref={this.sectionRefList[0]} id={styles.themes_list}>
                    <div>
                        <input
                        id={"radio-" + themeType.Without}
                        type="radio"
                        name="theme"
                        onChange={() => this.handleChooseTheme(themeType.Without)}
                        {...(!this.props.settings.sepia && !this.props.settings.night
                        && {checked: true})}
                        />
                        <label htmlFor={"radio-" + themeType.Without}>
                            {this.props.settings.predefined && <SVG svg={DoneIcon} ariaHidden/>}
                            { __("reader.settings.theme.name.Neutral")}
                        </label>
                    </div>
                    <div>
                        <input
                        id={"radio-" + themeType.Sepia}
                        type="radio"
                        name="theme"
                        onChange={() => this.handleChooseTheme(themeType.Sepia)}
                        {...(this.props.settings.sepia && {checked: true})}
                        />
                        <label htmlFor={"radio-" + themeType.Sepia}>
                            {this.props.settings.sepia && <SVG svg={DoneIcon} ariaHidden/>}
                            { __("reader.settings.theme.name.Sepia")}
                        </label>
                    </div>
                    <div>
                        <input
                        id={"radio-" + themeType.Night}
                        type="radio"
                        name="theme"
                        onChange={() => this.handleChooseTheme(themeType.Night)}
                        {...(this.props.settings.night && {checked: true})}
                        />
                        <label htmlFor={"radio-" + themeType.Night}>
                            {this.props.settings.night && <SVG svg={DoneIcon} ariaHidden/>}
                            { __("reader.settings.theme.name.Night")}
                        </label>
                    </div>
                </div>
            </>
        );
    }

    private textContent() {
        const {__, settings} = this.props;
        return <>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.fontSize")}</div>
                <div className={styles.center_in_tab}>
                    <span className={styles.slider_marker} >a</span>
                    <input type="range"
                        onChange={(e) => this.props.handleIndexChange(e, "fontSize")}
                        id="text_length"
                        min={0}
                        max={optionsValues.fontSize.length - 1}
                        value={this.props.indexes.fontSize}
                        step={1}
                        aria-valuemin={0}
                        aria-valuemax={optionsValues.fontSize.length - 1}
                        aria-valuenow={this.props.indexes.fontSize}
                    />
                    <output id={styles.valeur_taille} className={styles.out_of_screen}>14</output>
                    <span className={styles.slider_marker} style={{fontSize: "250%"}}>a</span>
                </div>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.font")}</div>
                <div className={styles.center_in_tab}>
                    <select
                        id={styles.police_texte}
                        onChange={(e) => this.props.handleSettingChange(e, "font")}
                        value={settings.font}
                    >
                        {fontList.map((font: Font, id: number) => {
                            return (
                                <option
                                    key={id}
                                    value={font.id}
                                >
                                    {font.label}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        </>;
    }

    private displayContent() {
        const {__, settings} = this.props;
        return <>
            <section className={styles.line_tab_content}>
            <div className={styles.subheading}>{__("reader.settings.disposition.title")}</div>
                <ul className={styles.center_in_tab}>
                    <li className={styles.focus_element}>
                        <input
                        id={styles.scroll_option}
                        type="radio"
                        name="disposition"
                        onChange={(e) => this.props.handleSettingChange(e, "paged", "false")}
                        />
                        <label htmlFor={styles.scroll_option}
                        className={this.getButtonClassName("paged", false)}>
                            <SVG svg={DefileIcon} title={__("reader.settings.scrolled")} />
                            {__("reader.settings.scrolled")}
                        </label>
                    </li>
                    <li className={styles.focus_element}>
                        <input
                        id={styles.page_option}
                        type="radio"
                        name="disposition"
                        onChange={(e) => this.props.handleSettingChange(e, "paged", "true")}
                        defaultChecked={true}
                        />
                        <label htmlFor={styles.page_option}
                        className={this.getButtonClassName("paged", true)}>
                            <SVG svg={PagineIcon} title={__("reader.settings.paginated")}/>
                            {__("reader.settings.paginated")}
                        </label>
                    </li>
                </ul>
            </section>
            <section className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.justification")}</div>
                <ul className={styles.center_in_tab}>
                    <li className={styles.focus_element}>
                        <input
                        id={"radio-" + styles.option_gauche}
                        name="alignment"
                        type="radio"
                        onChange={(e) => this.props.handleSettingChange(e, "align", "left")}
                        checked={this.props.settings.align === "left"}
                        />
                        <label htmlFor={"radio-" + styles.option_gauche}
                        className={this.getButtonClassName("align", "left")}>
                            <SVG svg={LeftIcon} title={__("reader.settings.left")}/>
                            {__("reader.settings.left")}
                        </label>
                    </li>
                    <li className={styles.focus_element}>
                        <input
                        id={"radio-" + styles.option_justif}
                        name="alignment"
                        type="radio"
                        onChange={(e) => this.props.handleSettingChange(e, "align", "justify")}
                        checked={this.props.settings.align === "justify"}
                        />
                        <label htmlFor={"radio-" + styles.option_justif}
                        className={this.getButtonClassName("align", "justify")}>
                            <SVG svg={JustifyIcon} title={__("reader.settings.justify")}/>
                            {__("reader.settings.justify")}
                        </label>
                    </li>
                </ul>
            </section>
            <section className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.column.title")}</div>
                <ul className={styles.center_in_tab}>
                    <li className={styles.focus_element}>
                        <input
                        id={"radio-" + styles.option_colonne}
                        type="radio"
                        name="column"
                        {...(!settings.paged && {disabled: true})}
                        role="link"
                        onChange={(e) =>
                        this.props.handleSettingChange(e, "colCount", colCountEnum.auto)}
                        checked={this.props.settings.colCount === colCountEnum.auto}
                        />
                        <label htmlFor={"radio-" + styles.option_colonne}
                        className={this.getButtonClassName("colCount",
                        !settings.paged ? null : colCountEnum.auto,
                        !settings.paged && styles.disable)}>
                            <SVG svg={AutoIcon} title={__("reader.settings.column.auto")}/>
                            {__("reader.settings.column.auto")}
                        </label>
                    </li>
                    <li className={styles.focus_element}>
                        <input
                        {...(!settings.paged && { disabled: true })}
                        id={"radio-" + styles.option_colonne1}
                        type="radio"
                        name="column"
                        role="link"
                        onChange={(e) => this.props.handleSettingChange(e, "colCount", colCountEnum.one)}
                        checked={this.props.settings.colCount === colCountEnum.one}
                        />
                        <label htmlFor={"radio-" + styles.option_colonne1}
                        className={this.getButtonClassName("colCount",
                        !settings.paged ? null : colCountEnum.one,
                        !settings.paged && styles.disable)}>
                            <SVG svg={ColumnIcon} title={__("reader.settings.column.one")}/>
                            {__("reader.settings.column.one")}
                        </label>
                    </li>
                    <li className={styles.focus_element}>
                        <input
                        id={"radio-" + styles.option_colonne2}
                        type="radio"
                        name="column"
                        {...(!settings.paged && { disabled: true })}
                        role="link"
                        onChange={(e) => this.props.handleSettingChange(e, "colCount", colCountEnum.two)}
                        checked={this.props.settings.colCount === colCountEnum.two}
                        />
                        <label htmlFor={"radio-" + styles.option_colonne2}
                        className={this.getButtonClassName("colCount",
                        !settings.paged ? null : colCountEnum.two,
                        !settings.paged && styles.disable)}>
                            <SVG svg={Column2Icon} title={__("reader.settings.column.two")}/>
                            {__("reader.settings.column.two")}
                        </label>
                    </li>
                </ul>
            </section>
        </>;
    }

    private spacingContent() {
        const {__, settings} = this.props;
        return <>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.margin")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "pageMargins")}
                    id="text_length"
                    min={0}
                    max={optionsValues.pageMargins.length - 1}
                    value={this.props.indexes.pageMargins}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.pageMargins.length - 1}
                    aria-valuenow={this.props.indexes.pageMargins}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(settings.pageMargins)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.wordSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "wordSpacing")}
                    id="text_length"
                    min={0}
                    max={optionsValues.wordSpacing.length - 1}
                    value={this.props.indexes.wordSpacing}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.wordSpacing.length - 1}
                    aria-valuenow={this.props.indexes.wordSpacing}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(settings.wordSpacing)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.letterSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "letterSpacing")}
                    id="text_length"
                    min={0}
                    max={optionsValues.letterSpacing.length - 1}
                    value={this.props.indexes.letterSpacing}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.letterSpacing.length - 1}
                    aria-valuenow={this.props.indexes.letterSpacing}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(settings.letterSpacing)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.lineSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "lineHeight")}
                    id="text_length"
                    min={0}
                    max={optionsValues.lineHeight.length - 1}
                    value={this.props.indexes.lineHeight}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.lineHeight.length - 1}
                    aria-valuenow={this.props.indexes.lineHeight}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(settings.lineHeight)}
                </span>
            </div>
        </>;
    }

    private handleChooseTheme(theme: themeType) {
        const values = this.props.settings;
        let neutral = false;
        let sepia = false;
        let night = false;

        switch (theme) {
            case themeType.Without:
                neutral = true;
                break;
            case themeType.Night:
                night = true;
                break;
            case themeType.Sepia:
                sepia = true;
                break;
        }
        values.predefined = neutral;
        values.sepia = sepia;
        values.night = night;

        this.props.setSettings(values);
    }

    // round the value to the hundredth
    private roundRemValue(value: string) {
        if (!value) {
            return "";
        }

        const nbr = parseFloat(value.replace("rem", ""));
        const roundNumber = (Math.round(nbr * 100) / 100);
        return roundNumber + " rem";
    }

    private getButtonClassName(propertyName: string, value: any, additionalClassName?: string): string {
        const property = this.props.settings[propertyName];
        let classname = "";
        if (property === value) {
            classname = styles.active;
        }
        return classNames(classname, additionalClassName);
    }
}

export default withTranslator(ReaderOptions) as any;
