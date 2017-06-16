import * as React from "react";

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Catalog } from "readium-desktop/models/catalog";
import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";

import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

import AppToolbar from "readium-desktop/renderer/components/AppToolbar";
import Library from "readium-desktop/renderer/components/Library";
import ReaderNYPL from "readium-desktop/renderer/components/ReaderNYPL";

import * as readerActions from "readium-desktop/renderer/actions/reader";
import * as windowActions from "readium-desktop/renderer/actions/window";
import { RendererState } from "readium-desktop/renderer/reducers";
import { ReaderStatus } from "readium-desktop/renderer/reducers/reader";

interface AppState {
    catalog: Catalog;
    readerOpen: boolean;
    manifestUrl?: string;
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class App extends React.Component<undefined, AppState> {
    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor() {
        super();
        let locale = this.store.getState().i18n.locale;

        if (locale == null) {
            this.store.dispatch(setLocale(defaultLocale));
        }

        this.translator.setLocale(locale);

        this.state = {
            catalog: undefined,
            readerOpen: false,
            manifestUrl: undefined,
        };

        this.handleOpenPublication = this.handleOpenPublication.bind(this);
        this.handleClosePublication = this.handleClosePublication.bind(this);
    }

    public handleOpenPublication(publication: Publication) {
        this.store.dispatch(readerActions.init(publication));
    }

    public handleClosePublication() {
        this.store.dispatch(readerActions.close());
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();
            const catalog = storeState.catalog;

            if (catalog.publications === undefined) {
                this.setState({catalog: undefined});
            } else {
                this.setState({catalog: {
                    title: "My Catalog",
                    publications: catalog.publications},
                });
            }

            this.setState({
                readerOpen: (storeState.reader.status === ReaderStatus.Open),
                manifestUrl: storeState.reader.manifestUrl,
            });

            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    {!this.state.readerOpen ? (
                    <div>
                        <AppToolbar />
                        <Library
                            catalog={this.state.catalog}
                            handleRead={this.handleOpenPublication}/>
                    </div>
                    ) : (
                        <div>
                            <ReaderNYPL
                                manifestURL={ encodeURIComponent_RFC3986(this.state.manifestUrl) }
                                handleClose={this.handleClosePublication} />
                        </div>
                    )}
                </div>
            </MuiThemeProvider>
        );
    }
}
