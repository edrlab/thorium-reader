import * as React from "react";

import AppBar from "material-ui/AppBar";
import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import NavigationClose from "material-ui/svg-icons/navigation/close";

import Library from "./Library";


const lightMuiTheme = getMuiTheme(lightBaseTheme);

export default class App extends React.Component<undefined, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <Library />
            </MuiThemeProvider>
        );
    }
}
