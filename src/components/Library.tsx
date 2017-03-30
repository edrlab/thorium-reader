import * as React from "react";

import { MinLength, validate } from "class-validator";

import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

import { ipcRenderer } from "electron";

export default class Library extends React.Component<undefined, undefined> {

    public _handleClick() {
        console.log("CLICK");

        // let response = ipcRenderer.sendSync('synchronous-message', 'RENDERER SYNC');
        // console.log(response);

        ipcRenderer.on('asynchronous-reply', (event, arg) => {
            console.log(arg);
        })
        ipcRenderer.send('asynchronous-message', 'RENDERER ASYNC')
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <h1>Book library</h1>
                <RaisedButton label="Click" onClick={this._handleClick} />
            </div>
        );
    }
}
