import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { Font } from "readium-desktop/common/models/font";
import fontList from "readium-desktop/utils/fontList";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

interface Props {
    open: boolean;
    settings: any;
    fontSizeIndex: number;
    handleLinkClick: (event: any, url: string) => void;
    handleSettingChange: (event: any, name: string, value?: any) => void;
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

        return (
            <div style={{display: this.props.open ? "initial" : "none"}} className={styles.read_settings}>
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
                                        onChange={(e) => this.props.handleSettingChange(e, "fontSize")}
                                        id="taille_texte"
                                        min="1"
                                        max="10"
                                        value={this.props.fontSizeIndex}
                                        step="1"
                                        aria-valuemin={1}
                                        aria-valuemax={10}
                                        aria-valuenow={this.props.fontSizeIndex}
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
                                    >
                                        {fontList.map((font: Font, id: number) => {
                                            return (
                                                <option
                                                    key={id}
                                                    {...(font.id === this.props.settings.font && {selected: true})}
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
                                        <img src="src/renderer/assets/icons/defile.svg" alt=""/>
                                        {__("reader.settings.scrolled")}
                                    </button>
                                    <button
                                        id={styles.page_option} role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "paged", "true")}
                                    >
                                        <img src="src/renderer/assets/icons/pagine.svg" alt=""/>
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
                                        <img src="src/renderer/assets/icons/gauche.svg" alt=""/>
                                        {__("reader.settings.left")}
                                    </button>
                                    <button
                                        id={styles.option_justif} role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "align", "justify")}
                                    >
                                        <img src="src/renderer/assets/icons/justifie.svg" alt=""/>
                                        {__("reader.settings.justify")}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>{__("reader.settings.column.title")}</div>
                                <div className={styles.center_in_tab}>
                                    <button
                                        id={styles.option_colonne}
                                        role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "colCount", "auto")}
                                    >
                                        <img src="src/renderer/assets/icons/auto.svg" alt=""/>
                                        {__("reader.settings.column.auto")}
                                    </button>
                                    <button
                                        id={styles.option_colonne1}
                                        role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "colCount", "1")}
                                    >
                                        <img src="src/renderer/assets/icons/colonne.svg" alt=""/>
                                        {__("reader.settings.column.one")}
                                    </button>
                                    <button
                                        id={styles.option_colonne2}
                                        role="link"
                                        onClick={(e) => this.props.handleSettingChange(e, "colCount", "2")}
                                    >
                                        <img src="src/renderer/assets/icons/colonne2.svg" alt=""/>
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
                                    type="number"
                                    placeholder="par défaut"
                                    title="Valeur des marges"
                                    id="margin_input"
                                    step="5"
                                    min="30"
                                    max="100"
                                    // value="50"
                                /> pt
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.wordSpacing")}
                                </div>

                                <input
                                    type="number"
                                    placeholder="par défaut"
                                    title="Valeur de l'espacement des mots"
                                    id="wordspacing_input"
                                    step="1"
                                    min="0"
                                    max="50"
                                    // value="0"
                                /> pt
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.letterSpacing")}
                                </div>
                                <input
                                    type="number"
                                    placeholder="par défaut"
                                    title="Valeur de l'espacement des lettres"
                                    id="letterspacing_input"
                                    step="0.5"
                                    min="0"
                                    max="8"
                                    // value="0"
                                /> pt
                            </div>
                            <div className={styles.line_tab_content}>
                                <div className={styles.subheading}>
                                    {__("reader.settings.lineSpacing")}
                                </div>
                                <input
                                    type="number"
                                    placeholder="par défaut"
                                    title="Valeur de l'espacement des lignes"
                                    id="lineheight_input"
                                    step="1"
                                    min="15"
                                    max="40"
                                    // value="18"
                                /> pt
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
                                        <img src="src/renderer/assets/icons/pagine.svg" alt=""/>
                                        {__("reader.settings.disposition.with")}
                                    </div>
                                    <div id={styles.page_option} role="link">
                                        <img src="src/renderer/assets/icons/pagine.svg" alt=""/>
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
