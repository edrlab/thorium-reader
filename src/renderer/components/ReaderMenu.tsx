import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Publication as R2Publication } from "@r2-shared-js/models/publication";

interface Props {
    open: boolean;
    publicationJsonUrl: string;
    publication: R2Publication;
    handleLinkClick: (event: any, url: string) => void;
}

interface State {
    sectionOpenList: boolean[];
}

export default class ReaderMenu extends React.Component<Props, State> {
    private sectionRefList: any = [];
    private tocRendererList: any;
    private clickableList: boolean[] = [];

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
        ];
    }

    public componentWillReceiveProps(newProps: Props) {
        if (!this.props.publication && newProps.publication) {
            console.log(newProps.publication);
            const pub: R2Publication = newProps.publication;
            this.tocRendererList = this.createTOCRenderList(pub.TOC);

            this.clickableList = [
                pub.TOC && pub.TOC.length > 0,
                pub.LOI && pub.LOI.length > 0,
                false,
                false,
            ];
        }
    }
    public render(): React.ReactElement<{}> {
        const pub = this.props.publication;

        return (
            <div style={{display: this.props.open ? "initial" : "none"}} className={styles.chapters_settings}>
                <ul className={styles.chapter_settings_list}>
                    <li
                        onClick={this.handleClickSection.bind(this, 0)}
                        className={!this.clickableList[0] && styles.tab_not_clickable}
                    >
                        Table des matières
                    </li>
                    <div style={this.getSectionStyle(0)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[0]} className={styles.line_tab_content}>
                            <ul className={styles.chapters_content}>
                                {this.props.publication && this.createTOCRenderList(this.props.publication.TOC)}
                            </ul>
                        </div>
                    </div>
                    <li
                        onClick={this.handleClickSection.bind(this, 1)}
                        className={!this.clickableList[1] && styles.tab_not_clickable}
                    >
                        Illustrations
                    </li>
                    <div style={this.getSectionStyle(1)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[1]} className={styles.line_tab_content}>
                        </div>
                    </div>
                    <li
                        onClick={this.handleClickSection.bind(this, 2)}
                        className={!this.clickableList[2] && styles.tab_not_clickable}
                    >
                        Signets
                    </li>
                    <div style={this.getSectionStyle(2)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[2]} className={styles.line_tab_content}>
                            {this.createLandmarkList()}
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                                <div className={styles.chapter_marker}>
                                    Chapitre 1
                                    <div className={styles.gauge}>
                                        <div className={styles.fill}></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                                <div className={styles.chapter_marker}>
                                Chapitre 1
                                <div className={styles.gauge}>
                                    <div className={styles.fill}></div>
                                </div>
                                </div>
                            </div>
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                                <div className={styles.chapter_marker}>
                                    Chapitre 1
                                    <div className={styles.gauge}>
                                        <div className={styles.fill}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <li
                        onClick={this.handleClickSection.bind(this, 3)}
                        className={!this.clickableList[3] && styles.tab_not_clickable}
                    >
                        Annotations
                    </li>
                    <div style={this.getSectionStyle(3)} className={styles.tab_content}>
                        <div ref={this.sectionRefList[3]} className={styles.line_tab_content}>
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/baseline-edit-24px-grey.svg" alt=""/>
                                <div className={styles.chapter_marker}>
                                    Chapitre 1
                                    <div className={styles.gauge}>
                                        <div className={styles.fill}></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.bookmarks_line}>
                                <img src="src/renderer/assets/icons/baseline-add-24px.svg"/>
                                <span>Nouvelle annotation</span>
                            </div>
                        </div>
                    </div>
                </ul>
                <form id={styles.insidebook_search} role="search">
                    <input
                        type="search"
                        id={styles.book_search}
                        placeholder="Rechercher dans le livre"
                        title="rechercher dans le livre"
                    />
                    <input
                        type="image"
                        id={styles.launch}
                        src="src/renderer/assets/icons/baseline-search-24px-grey.svg"
                        value=""
                        alt="lancer la recherche"
                    />
                </form>

                <div className={styles.go_to_page}>Aller à la page <input type="number" placeholder="13"/></div>
            </div>
        );
    }

    private handleClickSection(id: number) {
        console.log(id, this.clickableList[id]);
        if (this.clickableList[id]) {
            const { sectionOpenList } = this.state;
            sectionOpenList[id] = !sectionOpenList[id];
            this.setState({ sectionOpenList });
        }
    }

    private getSectionStyle(id: number): any {
        const el = this.sectionRefList[id];
        let height = 0;
        if (el.current) {
            height = el.current.offsetHeight;
        }
        return {maxHeight: this.state.sectionOpenList[id] ? height : 0};
    }

    private createTOCRenderList(TOC: any[]): JSX.Element[] {
        return TOC.map((content, i: number) => {
            const url = this.props.publicationJsonUrl + "/../" + content.Href;
            return (
                <li key={i}>
                    {content.Children ? (
                        <>
                            <a
                                className={styles.subheading}
                                onClick={(e) => this.props.handleLinkClick(e, url)}
                            >
                                {content.Title}
                            </a>
                            {content.Children &&
                                <ul className={styles.chapters_content}>
                                    {this.createTOCRenderList(content.Children)}
                                </ul>
                            }
                        </>
                    ) : (
                        <a
                            className={styles.line + " " + styles.active}
                            onClick={(e) => this.props.handleLinkClick(e, url)}
                        >
                            {content.Title}
                        </a>
                    )}
                </li>
            );
        });
    }

    private createLandmarkList(): JSX.Element[] {
        return this.props.publication.Landmarks.map((content, i: number) => {
            // const url = this.props.publicationJsonUrl + "/../" + content.Href;
            return (
                <div className={styles.bookmarks_line}>
                    <img src="src/renderer/assets/icons/outline-bookmark-24px-grey.svg" alt=""/>
                    <div className={styles.chapter_marker}>
                        Chapitre 1
                    <div className={styles.gauge}>
                        <div className={styles.fill}></div>
                    </div>
                    </div>
                </div>
            );
        });
    }
}
