import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface Props {
    navLeftOrRight: (left: boolean) => void;
}

interface States {
    moreInfo: boolean;
}

export default class ReaderFooter extends React.Component<Props, States> {

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: Props) {
        super(props);

        this.state =  {
            moreInfo: false,
        };

        this.handleMoreInfoClick = this.handleMoreInfoClick.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <div className={styles.reader_footer}>
                <div className={styles.arrows}>
                    <button onClick={() => this.props.navLeftOrRight(true)}>
                        <SVG svg={ArrowLeftIcon} title={__("reader.svg.left")} />
                    </button>
                    <button onClick={() => this.props.navLeftOrRight(false)}>
                        <SVG svg={ArrowRightIcon} title={__("reader.svg.right")} />
                    </button>
                </div>
                <div className={styles.track_reading_wrapper}>
                    <div id={styles.track_reading} aria-hidden="true">
                        <div id={styles.current}></div>

                        <div id={styles.chapters_markers}>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>

                    <span
                        onClick={this.handleMoreInfoClick}
                        aria-hidden="true"
                        id={styles.more_info_chapters}
                    >
                        {this.state.moreInfo ? "Moins d'informations" : "Plus d'informations"}
                    </span>

                    <div style={{display: this.state.moreInfo ? "initial" : "none"}} id={styles.arrow_box}>
                        <span>Chapitre 5</span>
                        <p>Nom du chapitre 23/453</p>
                    </div>
                </div>
            </div>
        );
    }

    private handleMoreInfoClick() {
        this.setState({moreInfo: !this.state.moreInfo});
    }
}
