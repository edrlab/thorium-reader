import * as React from "react";

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { lazyInject } from "readium-desktop/renderer/di";

import { Catalog } from "readium-desktop/models/catalog";

import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";
import { RendererState } from "readium-desktop/renderer/reducers";

import AppToolbar from "readium-desktop/components/AppToolbar";
import Library from "readium-desktop/components/Library";
import ReaderNYPL from "readium-desktop/components/ReaderNYPL";

interface AppState {
    catalog: Catalog;
    isReader: boolean;
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
            isReader: false,
        };
    }

    public ToggleReaderView = () => {
        this.setState({isReader: !this.state.isReader});
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            this.setState({catalog: this.store.getState().catalog.catalog});
            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        let manifestUrl = "https://readium2.herokuapp.com/pub/L2FwcC9jaGlsZHJlbnMtbGl0ZXJhdHVyZS5lcHVi/manifest.json";
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    {!this.state.isReader ? (
                    <div>
                        <AppToolbar />
                        <Library
                            catalog={this.state.catalog}
                            handleRead={this.ToggleReaderView.bind(this)}/>
                    </div>
                    ) : (
                        <div>
                            <ReaderNYPL
                                manifestURL={manifestUrl}
                                handleRead={this.ToggleReaderView.bind(this)} />
                        </div>
                    )}
                </div>
            </MuiThemeProvider>
        );
    }
}
