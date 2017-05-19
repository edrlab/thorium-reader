import * as React from "react";

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { setLocale } from "readium-desktop/actions/i18n";
import { lazyInject } from "readium-desktop/renderer/di";
import { Translator } from "readium-desktop/i18n/translator";
import { IAppState } from "readium-desktop/reducers/app";

import AppToolbar from "readium-desktop/components/AppToolbar";
import Library from "readium-desktop/components/Library";

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class App extends React.Component<undefined, undefined> {
    @lazyInject("store")
    private store: Store<IAppState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor() {
        super();
        let locale = this.store.getState().i18n.locale;

        if (locale == null) {
            this.store.dispatch(setLocale(defaultLocale));
        }

        this.translator.setLocale(locale);
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            this.translator.setLocale(this.store.getState().i18n.locale);
        });
    }

    public render(): React.ReactElement<{}> {
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    <AppToolbar />
                    <Library />
                </div>
            </MuiThemeProvider>
        );
    }
}
