import * as React from "react";
import { Store } from "redux";

import RaisedButton from "material-ui/RaisedButton";

import { lazyInject } from "../di";
import { Translator } from "../i18n/translator";
import { IAppState } from "../reducers/app";

// DANIEL - IPC test
import { ipcRenderer } from "electron";

interface ILibraryState {
    locale: string;
}

export default class Library extends React.Component<undefined, ILibraryState> {
    public state: ILibraryState;

    @lazyInject(Translator)
    private translator: Translator;

    @lazyInject("store")
    private store: Store<IAppState>;

    constructor() {
        super();
        this.state = {
            locale: this.store.getState().i18n.locale,
        };
    }

    // DANIEL - IPC test
    public _handleClick() {
        console.log("CLICK");

        // let response = ipcRenderer.sendSync('synchronous-message', 'RENDERER SYNC');
        // console.log(response);

        ipcRenderer.on("asynchronous-reply", (event, arg) => {
            console.log(arg);
        });

        ipcRenderer.send("asynchronous-message", "RENDERER ASYNC");
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            this.setState({
                locale: this.store.getState().i18n.locale,
            });
        });
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;

        return (
            <div>
                <h1>{__("library.heading")}</h1>

                <RaisedButton label="DANIEL - IPC test" onClick={this._handleClick} />
            </div>
        );
    }
}
