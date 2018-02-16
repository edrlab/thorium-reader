import * as React from "react";

import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import { blue500 } from "material-ui/styles/colors";

import { Store } from "redux";

import {
    catalogActions,
    publicationDownloadActions,
} from "readium-desktop/common/redux/actions";

import { Publication } from "readium-desktop/common/models/publication";

import { getMultiLangString } from "readium-desktop/common/models/language";

import { lazyInject } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";

import { Translator } from "readium-desktop/common/services/translator";

import { Catalog } from "readium-desktop/common/models/catalog";

import * as classNames from "classnames";
import CardIcon from "readium-desktop/renderer/assets/icons/view-card.svg";
import ListIcon from "readium-desktop/renderer/assets/icons/view-list.svg";
import * as LibraryStyles from "readium-desktop/renderer/assets/styles/library.css";

import { PublicationCard, PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

import { Styles } from "readium-desktop/renderer/components/styles";

interface ILibraryState {
    list: boolean;
    open: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: any;
    openSnackbar: any;
    openDialog: any;
}

interface IDownload {
    link: string;
    progress: number;
}

export default class Library extends React.Component<LibraryProps, ILibraryState> {
    public state: ILibraryState;
    public props: LibraryProps;

    @lazyInject("translator")
    private translator: Translator;

    @lazyInject("store")
    private store: Store<RootState>;

    constructor(props: LibraryProps) {
        super(props);

        this.state = {
            open: false,
            list: false,
        };
    }

    public componentDidMount() {
        // this.store.dispatch(windowActions.showLibrary());
    }

    public downloadEPUB = (newPublication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.add(newPublication));
    }

    public cancelDownload = (publication: Publication, publicationId: number) => {
        this.store.dispatch(publicationDownloadActions.cancel(publication));
    }

    public deletePublication = (publication: Publication) => {
        this.store.dispatch(catalogActions.removePublication(publication));
    }

    public openDeleteDialog = (publication: Publication) => {
        const message: JSX.Element = (<p>{this.translator.translate("dialog.delete")}</p>);
        this.props.openDialog(
            message,
            this.deletePublication.bind(this, publication),
        );
    }

    public Spinner() {
        return (
            <FontIcon
                style = {Styles.Library.spinner}
                className="fa fa-spinner fa-spin fa-3x fa-fw"
                color={blue500}
            />
        );
    }

    public createCardList() {
        const list: any = [];
        let i = 0;
        for (const pub of this.props.catalog.publications.sort(this.sort)) {
            list.push(<PublicationCard key={i}
                publicationId={i}
                downloadable={false}
                publication={pub}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload.bind(this)}
                deletePublication={this.openDeleteDialog.bind(this)}/>);
            i++;
        }
        return list;
    }

    public createElementList() {
        const list: any = [];
        let i = 0;
        for (const pub of this.props.catalog.publications.sort(this.sort)) {
            list.push(<PublicationListElement key={i}
                publication={pub}
                publicationId={i}
                downloadable={false}
                downloadEPUB={this.downloadEPUB}
                handleRead={this.props.handleRead.bind(this)}
                cancelDownload={this.cancelDownload}
                deletePublication={this.openDeleteDialog.bind(this)}/>);
            i++;
        }
        return <div style={Styles.BookListElement.container}> {list} </div>;
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);
        const list = this.state.list;

        const that = this;
        let listToDisplay: JSX.Element;
        if (this.props.catalog) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = (
                    <div className={LibraryStyles.card_container}>
                        {this.createCardList()}
                    </div>
                );
            }
        } else {
            listToDisplay = <this.Spinner/>;
        }

        return (
            <div>
                <div>
                    <button
                        className={
                            classNames(LibraryStyles.display_button, !list && LibraryStyles.display_button_disable)
                        }
                        onClick={() => {that.setState({list: true});
                    }}>
                        <svg viewBox={ListIcon.content_table}>
                            <title>Add EPUB</title>
                            <use xlinkHref={"#" + ListIcon.id} />
                        </svg>
                    </button>
                    <button
                        className={
                            classNames(LibraryStyles.display_button, list && LibraryStyles.display_button_disable)
                        }
                        onClick={() => {that.setState({list: false});
                    }}>
                        <svg viewBox={CardIcon.content_table}>
                            <title>Add EPUB</title>
                            <use xlinkHref={"#" + CardIcon.id} />
                        </svg>
                    </button>
                </div >
                <div style={Styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }

    private sort(a: Publication, b: Publication) {

        // TODO: should get language from view state? (user preferences)
        const lang = "en";
        const atitle = getMultiLangString(a.title, lang);
        const btitle = getMultiLangString(b.title, lang);

        if (atitle > btitle) {
            return 1;
        } else if (atitle === btitle) {
            return 0;
        } else {
            return -1;
        }
    }
}
