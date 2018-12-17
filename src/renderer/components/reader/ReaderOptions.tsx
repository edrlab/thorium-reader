import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Font } from "readium-desktop/common/models/font";
import fontList from "readium-desktop/utils/fontList";

import * as AutoIcon from "readium-desktop/renderer/assets/icons/auto.svg";
import * as ColumnIcon from "readium-desktop/renderer/assets/icons/colonne.svg";
import * as Column2Icon from "readium-desktop/renderer/assets/icons/colonne2.svg";
import * as DefileIcon from "readium-desktop/renderer/assets/icons/defile.svg";
import * as LeftIcon from "readium-desktop/renderer/assets/icons/gauche.svg";
import * as JustifyIcon from "readium-desktop/renderer/assets/icons/justifie.svg";
import * as PagineIcon from "readium-desktop/renderer/assets/icons/pagine.svg";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { colCountEnum } from "@r2-navigator-js/electron/common/readium-css-settings";

import optionsValues from "./optionsValues";

interface Props {
    open: boolean;
    settings: any;
    indexes: {fontSize: number, pageMargins: number, wordSpacing: number, letterSpacing: number, paraSpacing: number};
    handleLinkClick: (event: any, url: string) => void;
    handleSettingChange: (event: any, name: string, value?: any) => void;
    handleIndexChange: (event: any, name: string, value?: any) => void;
}

interface State {
    sectionOpenList: boolean[];
}

export default class ReaderOptions extends React.Component<Props, State> {
    private sectionRefList: any = [];

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: Props) {
        super(props);

        this.state = {
            sectionOpenList: [],
        };

        this.sectionRefList = [
            React.createRef(),
            React.createRef(),
            React.createRef(),
            React.createRef(),
            React.createRef(),
        ];
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        if (!this.props.settings) {
            return <></>;
        }

        return (
            <div style={{visibility: this.props.open ? "visible" : "hidden"}} className={styles.read_settings}>
                <ul id={styles.read_settings_list}>
                    <li onClick={this.handleClickSection.bind(this, 0)}>{__("reader.settings.theme.title")}</li>
                    <div style={this.getSectionStyle(0)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[0]}>
                            <div ref={this.sectionRefList[0]} className={styles.line_tab_content}>
                                <div className={styles.subheading}>{__("reader.settings.theme.predefined")}</div>
                                <div className={styles.theme_choices}>
                                    <input type="radio" id="theme1" name="theme" value="theme1" />
                                    <label>Thème 1</label>
                                </div>
                                <div className={styles.theme_choices}>
                                    <input type="radio" id="theme2" name="theme" value="theme2" />
                                    <label>Thème 2</label>
                                </div>
                                <div className={styles.theme_choices}>
                                    <input type="radio" id="theme3" name="theme" value="theme3" />
                                    <label>Thème 3</label>
                                </div>
                                <div className={styles.separateur}></div>
                                <div className={styles.subheading}>{__("reader.settings.theme.myTheme")}</div>
                                <div className={styles.theme_choices}>
                                    <input type="radio" id="theme4" name="theme" value="theme4" />
                                    <label>Thème 4</label>
                                </div>
                                <div className={styles.theme_choices}>
                                    <input type="radio" id="theme5" name="theme" value="theme5" />
                                    <label>Thème 5</label>
                                </div>

                                <div className={styles.separateur}></div>

                                <a className={styles.lire_creertheme} href="preferences_2.html">
                                    {__("reader.settings.theme.create")}
                                </a>
                            </div>
                        </div>
                    </div>
                    <li onClick={this.handleClickSection.bind(this, 1)}>{__("reader.settings.text")}</li>
                    <div style={this.getSectionStyle(1)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[1]}>
                            <div className={styles.line_tab_content}>
                                <label>{__("reader.settings.fontSize")}</label>
                                <div className={styles.center_in_tab}>
                                    <span className={styles.slider_marker} >a</span>
                                    <input type="range"
                                        onChange={(e) => this.props.handleIndexChange(e, "fontSize")}
                                        id="taille_texte"
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
                                <label >{__("reader.settings.font")}</label>
                                <div className={styles.center_in_tab}>
                                    <select
                                        id={styles.police_texte}
                                        onChange={(e) => this.props.handleSettingChange(e, "font")}
                                        value={this.props.settings.font}
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
                            {/* <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>Couleur du texte</div>
                                <div className={styles.center_in_tab}>
                                    <div className={styles.pref_color}>
                                        <div className={styles.circle_color}></div>
                                        <div className={styles.circle_color} ></div>
                                        <div className={styles.circle_color} ></div>
                                        <div className={styles.circle_color} ></div>
                                        <div className={styles.circle_color} ></div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                    <li onClick={this.handleClickSection.bind(this, 2)}>{__("reader.settings.display")}</li>
                    <div style={this.getSectionStyle(2)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[2]}>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>{__("reader.settings.disposition.title")}</div>
                                <div className={styles.center_in_tab}>
                                    <button
                                        id={styles.scroll_option} role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "paged", "false")}
                                    >
                                        <SVG svg={DefileIcon} title={__("reader.settings.scrolled")}/>
                                        {__("reader.settings.scrolled")}
                                    </button>
                                    <button
                                        id={styles.page_option} role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "paged", "true")}
                                    >
                                        <SVG svg={PagineIcon} title={__("reader.settings.paginated")}/>
                                        {__("reader.settings.paginated")}
                                    </button>
                                </div>
                                </div>
                                <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>{__("reader.settings.justification")}</div>
                                <div className={styles.center_in_tab}>
                                    <button
                                        id={styles.option_gauche} role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "align", "left")}
                                    >
                                        <SVG svg={LeftIcon} title={__("reader.settings.left")}/>
                                        {__("reader.settings.left")}
                                    </button>
                                    <button
                                        id={styles.option_justif} role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "align", "justify")}
                                    >
                                        <SVG svg={JustifyIcon} title={__("reader.settings.justify")}/>
                                        {__("reader.settings.justify")}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>{__("reader.settings.column.title")}</div>
                                <div className={styles.center_in_tab}>
                                    <button
                                        id={styles.option_colonne}
                                        {...(!this.props.settings.paged && {className: styles.disable, disabled: true})}
                                        role="link"
                                        onClick={(e) =>
                                            this.props.handleSettingChange(e, "colCount", colCountEnum.auto)}
                                    >
                                        <SVG svg={AutoIcon} title={__("reader.settings.column.auto")}/>
                                        {__("reader.settings.column.auto")}
                                    </button>
                                    <button
                                        {...(!this.props.settings.paged && {className: styles.disable, disabled: true})}
                                        id={styles.option_colonne1}
                                        role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "colCount", colCountEnum.one)}
                                    >
                                        <SVG svg={ColumnIcon} title={__("reader.settings.column.one")}/>
                                        {__("reader.settings.column.one")}
                                    </button>
                                    <button
                                        id={styles.option_colonne2}
                                        {...(!this.props.settings.paged && {className: styles.disable, disabled: true})}
                                        role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "colCount", colCountEnum.two)}
                                    >
                                        <SVG svg={Column2Icon} title={__("reader.settings.column.two")}/>
                                        {__("reader.settings.column.two")}
                                    </button>
                                </div>
                            </div>
                            {/* <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>Couleur du fond</div>

                                <div className={styles.center_in_tab}>
                                    <div className={styles.pref_back}>
                                        <div className={styles.circle_color}>
                                        </div>
                                        <div className={styles.circle_color} >
                                        </div>
                                        <div className={styles.circle_color} >
                                        </div>
                                        <div className={styles.circle_color} >
                                        </div>
                                        <div className={styles.circle_color} >
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                    <li onClick={this.handleClickSection.bind(this, 3)}>{__("reader.settings.spacing")}</li>
                    <div style={this.getSectionStyle(3)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[3]}>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.margin")}
                                </div>
                                <input
                                    type="range"
                                    onChange={(e) => this.props.handleIndexChange(e, "pageMargins")}
                                    title="Valeur des marges"
                                    id="taille_texte"
                                    min={0}
                                    max={optionsValues.pageMargins.length - 1}
                                    value={this.props.indexes.pageMargins}
                                    step={1}
                                    aria-valuemin={0}
                                    aria-valuemax={optionsValues.pageMargins.length - 1}
                                    aria-valuenow={this.props.indexes.pageMargins}
                                />
                                {/* {this.props.settings.pageMargins} */}
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.wordSpacing")}
                                </div>
                                <input
                                    type="range"
                                    onChange={(e) => this.props.handleIndexChange(e, "wordSpacing")}
                                    title="Valeur des marges"
                                    id="taille_texte"
                                    min={0}
                                    max={optionsValues.wordSpacing.length - 1}
                                    value={this.props.indexes.wordSpacing}
                                    step={1}
                                    aria-valuemin={0}
                                    aria-valuemax={optionsValues.wordSpacing.length - 1}
                                    aria-valuenow={this.props.indexes.wordSpacing}
                                />
                                {/* {this.props.settings.wordSpacing} */}
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.letterSpacing")}
                                </div>
                                <input
                                    type="range"
                                    onChange={(e) => this.props.handleIndexChange(e, "letterSpacing")}
                                    title="Valeur des marges"
                                    id="taille_texte"
                                    min={0}
                                    max={optionsValues.letterSpacing.length - 1}
                                    value={this.props.indexes.letterSpacing}
                                    step={1}
                                    aria-valuemin={0}
                                    aria-valuemax={optionsValues.letterSpacing.length - 1}
                                    aria-valuenow={this.props.indexes.letterSpacing}
                                />
                                {/* {this.props.settings.letterSpacing} */}
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.lineSpacing")}
                                </div>
                                <input
                                    type="range"
                                    onChange={(e) => this.props.handleIndexChange(e, "paraSpacing")}
                                    title="Valeur des marges"
                                    id="taille_texte"
                                    min={0}
                                    max={optionsValues.paraSpacing.length - 1}
                                    value={this.props.indexes.paraSpacing}
                                    step={1}
                                    aria-valuemin={0}
                                    aria-valuemax={optionsValues.paraSpacing.length - 1}
                                    aria-valuenow={this.props.indexes.paraSpacing}
                                />
                                {/* {this.props.settings.paraSpacing} */}
                            </div>
                        </div>
                    </div>
                    <li onClick={this.handleClickSection.bind(this, 4)}>{__("reader.settings.accessibility")}</li>
                    <div style={this.getSectionStyle(4)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[4]}>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>{__("reader.settings.disposition.title")}</div>
                                <div className={styles.center_in_tab}>
                                    <div id={styles.page_option} role="link">
                                        <SVG svg={PagineIcon} title={__("reader.settings.disposition.with")}/>
                                        {__("reader.settings.disposition.with")}
                                    </div>
                                    <div id={styles.page_option} role="link">
                                        <SVG svg={PagineIcon} title={__("reader.settings.disposition.without")}/>
                                        {__("reader.settings.disposition.without")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ul>
            </div>
        );
    }

    private handleClickSection(id: number) {
        const { sectionOpenList } = this.state;
        sectionOpenList[id] = !sectionOpenList[id];
        this.setState({ sectionOpenList });
    }

    private getSectionStyle(id: number): any {
        const el = this.sectionRefList[id];
        let height = 0;
        if (el.current) {
            height = el.current.offsetHeight;
        }
        return {maxHeight: this.state.sectionOpenList[id] ? height : 0};
    }
}
