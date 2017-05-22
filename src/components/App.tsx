import * as React from "react";

import { ipcRenderer } from "electron";

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { CATALOG_GET_RESPONSE } from "readium-desktop/events/ipc";
import { Catalog } from "readium-desktop/models/catalog";
import { CatalogMessage } from "readium-desktop/models/ipc";

import { setLocale } from "../actions/i18n";
import { lazyInject } from "../di";
import { Translator } from "../i18n/translator";
import {IAppState as IViewState}  from "../reducers/app";

import AppToolbar from "./AppToolbar";
import Library from "./Library";

interface IAppState {
    catalog: Catalog;
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class App extends React.Component<undefined, IAppState> {
    @lazyInject("store")
    private store: Store<IViewState>;

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

        this.retrieveCatalog();
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public retrieveCatalog() {
        ipcRenderer.on(CATALOG_GET_RESPONSE, (event: any, msg: CatalogMessage) => {
            this.setState({catalog: msg.catalog});
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
