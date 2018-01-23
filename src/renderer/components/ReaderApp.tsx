import * as React from "react";

import FlatButton from "material-ui/FlatButton";

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Publication } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";

import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

import * as readerActions from "readium-desktop/renderer/actions/reader";
import * as windowActions from "readium-desktop/renderer/actions/window";
import { RendererState } from "readium-desktop/renderer/reducers";

interface ReaderAppState {
    openManifestUrl?: string;
    openPublication?: Publication;
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class ReaderApp extends React.Component<undefined, ReaderAppState> {
    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor(props: any) {
        super(props);
        let locale = this.store.getState().i18n.locale;

        if (locale == null) {
            this.store.dispatch(setLocale(defaultLocale));
        }

        this.translator.setLocale(locale);

        this.state = {
            openManifestUrl: undefined,
            openPublication: undefined,
        };
    }

    public componentDidMount() {
        // this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();
            console.log("storeState (INDEX READER):");
            console.log(storeState);

            this.setState({
                openManifestUrl: storeState.reader.manifestUrl,
                openPublication: storeState.reader.publication,
            });

            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                {(<FlatButton
                    label="TEST"
                    onClick={() => { console.log(window.location.search); console.log(this.state); console.log(this.store.getState()); }}
                />)}
                </div>
            </MuiThemeProvider>
        );
    }
}
