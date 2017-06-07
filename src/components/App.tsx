import * as React from "react";

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Catalog } from "readium-desktop/models/catalog";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";


import AppToolbar from "readium-desktop/components/AppToolbar";
import Library from "readium-desktop/components/Library";

import * as windowActions from "readium-desktop/renderer/actions/window";
import { RendererState } from "readium-desktop/renderer/reducers";

interface AppState {
    catalog: Catalog;
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
        };
    }

    public componentDidMount() {
        this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const catalog = this.store.getState().catalog;

            if (catalog.publications === undefined) {
                this.setState({catalog: undefined});
            } else {
                this.setState({catalog: {
                    title: "My Catalog",
                    publications: catalog.publications}
                });
            }

            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    <AppToolbar />
                    <Library catalog={this.state.catalog}/>
                </div>
            </MuiThemeProvider>
        );
    }
}
