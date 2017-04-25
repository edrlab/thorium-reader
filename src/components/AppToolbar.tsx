import * as React from "react";
import { Store } from "redux";

import DropDownMenu from "material-ui/DropDownMenu";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import { blue500 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from "material-ui/Toolbar";

import { setLocale } from "../actions/i18n";
import { lazyInject } from "../di";
import { IAppState } from "../reducers/app";

interface AppToolbarState {
    locale: string;
}

const styles = {
    fileInput: {
        bottom: 0,
        cursor: "pointer",
        left: 0,
        opacity: 0,
        position: "absolute",
        right: 0,
        top: 0,
        width: "100%",
        zIndex: 100,
    },
    iconButton: {
        margin: 12,
    },
};

export default class AppToolbar extends React.Component<undefined, AppToolbarState> {
    public state: AppToolbarState;

    @lazyInject("store")
    private store: Store<IAppState>;

    constructor() {
        super();
        this.state = {
            locale: this.store.getState().i18n.locale,
        };

        this.handleLocaleChange = this.handleLocaleChange.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        return (
            <Toolbar>
                <ToolbarGroup firstChild={true}>
                    <DropDownMenu value={this.state.locale} onChange={this.handleLocaleChange}>
                        <MenuItem value="en" primaryText="English" />
                        <MenuItem value="fr" primaryText="French" />
                    </DropDownMenu>
                </ToolbarGroup>
                <ToolbarGroup>
                    <ToolbarTitle text="Options" />
                    <FontIcon className="muidocs-icon-custom-sort" />
                    <ToolbarSeparator />
                    <IconButton touch={true}>
                        <FontIcon
                            className="fa fa-plus-circle"
                            style={styles.iconButton}
                            color={blue500}>
                            <input type="file" style={styles.fileInput} />
                        </FontIcon>
                    </IconButton>
                    <IconMenu
                        iconButtonElement={
                            <IconButton touch={true}>
                                <FontIcon
                                    className="fa fa-home"
                                    style={styles.iconButton}
                                    color={blue500} />
                            </IconButton>
                        }
                    >
                        <MenuItem primaryText="Download" />
                        <MenuItem primaryText="More Info" />
                    </IconMenu>
                </ToolbarGroup>
            </Toolbar>
        );
    }
    private handleLocaleChange(event: any, index: any, locale: string) {
        this.store.dispatch(setLocale(locale));
    }
}
