import * as React from "react";

import FontIcon     from "material-ui/FontIcon";
import IconButton   from "material-ui/IconButton";
import { blue500 }  from "material-ui/styles/colors";

import { Store } from "redux";

import * as publicationimportActions from "readium-desktop/actions/collection-manager";
import * as publicationDownloadActions from "readium-desktop/actions/publication-download";

import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";

// import * as windowActions from "readium-desktop/renderer/actions/window";

import { Translator }   from "readium-desktop/i18n/translator";

import { Catalog } from "readium-desktop/models/catalog";

import { PublicationCard, PublicationListElement } from "readium-desktop/renderer/components/Publication/index";

import { Styles } from "readium-desktop/renderer/components/styles";

interface ILibraryState {
    list: boolean;
    open: boolean;
}

interface LibraryProps {
    catalog: Catalog;
    handleRead: Function;
    openSnackbar: Function;
    openDialog: Function;
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

    private __ = this.translator.translate;

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

    public deletePublication = (identifier: string) => {
        this.store.dispatch(publicationimportActions.fileDelete(identifier));
    }

    public openDeleteDialog = (identifier: string) => {
        let message: JSX.Element = (<p>{this.translator.translate("dialog.delete")}</p>);
        this.props.openDialog(message, this.deletePublication.bind(this, identifier));
    }

    public Spinner () {
        return (
            <FontIcon
                style = {Styles.Library.spinner}
                className="fa fa-spinner fa-spin fa-3x fa-fw"
                color={blue500}
            />
        );
    }

    public createCardList() {
        let list: any = [];
        let i = 0;
        for (let pub of this.props.catalog.publications.sort(this.sort)) {
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
        let list: any = [];
        let i = 0;
        for (let pub of this.props.catalog.publications.sort(this.sort)) {
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
        const that = this;
        let listToDisplay: JSX.Element;
        if (this.props.catalog) {
            if (this.state.list) {
                listToDisplay = this.createElementList();
            } else {
                listToDisplay = this.createCardList();
            }
        } else {
            listToDisplay = <this.Spinner/>;
        }

        return (
            <div>
                <div>
                    <h1 style={Styles.Library.title}>{this.__("library.heading")}</h1>
                    <IconButton
                        style={Styles.Library.displayButton}
                        touch={true} onClick={() => {
                            that.setState({list: true});
                        }}
                    >
                        <FontIcon className="fa fa-list" color={blue500} />
                    </IconButton>
                    <IconButton
                        style={Styles.Library.displayButton}
                        touch={true}  onClick={() => {
                            that.setState({list: false});
                        }}
                    >
                        <FontIcon className="fa fa-th-large" color={blue500} />
                    </IconButton>
                </div >
                <div style={Styles.Library.list}>
                    {listToDisplay}
                </div>
            </div>
        );
    }

    private sort (a: Publication, b: Publication) {
        if (a.title > b.title) {
            return 1;
        } else if (a.title === b.title) {
            return 0;
        } else {
            return -1;
        }
    }
}
