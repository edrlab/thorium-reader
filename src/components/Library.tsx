import * as React from "react";

import { MinLength, validate } from "class-validator";

import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

export default class Library extends React.Component<undefined, undefined> {

    public render(): React.ReactElement<{}>  {
        return (
        <div>
            <h1>Book library</h1>
            <RaisedButton label="Click" />
        </div>
        );
    }
}
