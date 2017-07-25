import * as commonmark from "commonmark";
import * as fs from "fs";
import * as React from "react";
import { Store } from "redux";

import Dialog from "material-ui/Dialog";
import DropDownMenu from "material-ui/DropDownMenu";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import { blue500 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from "material-ui/Toolbar";

import FlatButton from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import * as publicationimportActions from "readium-desktop/actions/collection-manager";
import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";
import { RendererState } from "readium-desktop/renderer/reducers";

import CollectionDialog from "readium-desktop/renderer/components/CollectionDialog";
import { Styles } from "readium-desktop/renderer/components/styles";

import { OPDSParser } from "readium-desktop/services/opds";

import { Catalog } from "readium-desktop/models/catalog";

import * as request from "request";

interface AppToolbarState {
    locale: string;
    open: boolean;
    dialogContent: string;
    opdsImportOpen: boolean;
    opdsUrl: string;
    opdsCatalog: Catalog;
}

interface AppToolbarProps {
    openDialog: Function;
    closeDialog: Function;
}

export default class AppToolbar extends React.Component<AppToolbarProps, AppToolbarState> {
    public state: AppToolbarState;

    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("translator")
    private translator: Translator;

    private importOPDSAction = [
        <FlatButton
            label="Importer"
            primary={true}
            onTouchTap={() => {
                this.props.closeDialog();
                this.downloadOPDS();
                this.setState({opdsImportOpen: true});
            }}
        />,
        <FlatButton
            label="Annuler"
            primary={true}
            onTouchTap={() => {this.props.closeDialog(); }}
        />,
    ];

    private importOPDSMessage = (
        <div>
            <p>Quel flux OPDS souhaitez vous importer ?</p>
            <input type="text" style={Styles.OpdsList.textZone} onChange={this.handleOpdsUrlChange.bind(this)}/>
        </div>
    );

    constructor() {
        super();
        this.state = {
            dialogContent: undefined,
            locale: this.store.getState().i18n.locale,
            open: false,
            opdsImportOpen: false,
            opdsUrl: undefined,
            opdsCatalog: undefined,
        };

        this.handleLocaleChange = this.handleLocaleChange.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate;
        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onTouchTap={this.handleClose}
            />,
        ];

        const that = this;
        const helpUrl = "./src/resources/docs/" + this.state.locale + "/help.md";
        const aboutUrl = "./src/resources/docs/" + this.state.locale + "/about.md";

        return (
            <div>
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
                            <IconMenu
                                iconButtonElement={<FontIcon
                                    className="fa fa-plus-circle"
                                    style={Styles.appToolbar.iconButton}
                                    color={blue500}>
                                </FontIcon>}>
                                <MenuItem primaryText="From an epub file">
                                    <input
                                    type="file"
                                    onChange={this.handleFileChange}
                                    style={Styles.appToolbar.inputImport} />
                                </MenuItem>
                                <MenuItem
                                    primaryText="From an opds flux"
                                    onClick={() => {
                                        this.props.openDialog(this.importOPDSMessage, null,  this.importOPDSAction);
                                    }}/>
                        </IconMenu>
                        <IconMenu
                            iconButtonElement={
                                <IconButton touch={true}>
                                    <FontIcon
                                        className="fa fa-ellipsis-v"
                                        style={Styles.appToolbar.iconButton}
                                        color={blue500} />
                                </IconButton>
                            }
                        >
                            <MenuItem
                                primaryText= {__("toolbar.help")}
                                onClick={() => {
                                    that.handleOpen(helpUrl);
                                }}
                                leftIcon={<FontIcon className="fa fa-question-circle" color={blue500} />} />
                            <MenuItem
                                primaryText={__("toolbar.news")}
                                onClick={() => {
                                    that.handleOpen(aboutUrl);
                                }}
                                leftIcon={<FontIcon className="fa fa-gift" color={blue500} />} />
                            <MenuItem
                                primaryText={__("toolbar.sync")}
                                leftIcon={<FontIcon className="fa fa-refresh"
                                color={blue500} />} />
                        </IconMenu>
                    </ToolbarGroup>
                </Toolbar>

                <Dialog
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                    autoScrollBodyContent={true}
                    >
                    <div dangerouslySetInnerHTML={{__html: this.state.dialogContent}} />
                </Dialog>
                <CollectionDialog
                    open={this.state.opdsImportOpen}
                    closeFunction={this.closeCollectionDialog.bind(this)}
                    catalog={this.state.opdsCatalog}/>
            </div>
        );
    }

    private handleOpen = (url: string) => {
        const content = fs.readFileSync(url).toString();
        const reader = new commonmark.Parser();
        const writer = new commonmark.HtmlRenderer();

        const parsed = reader.parse(content);
        const result = writer.render(parsed);
        this.setState({open: true});
        this.setState({dialogContent : result});
    }

    private handleClose = () => {
        this.setState({open: false});
    }

    private handleLocaleChange(event: any, index: any, newLocale: string) {
        this.store.dispatch(setLocale(newLocale));
        this.setState({locale: newLocale});
    }

    private handleFileChange(event: any) {
        const files: FileList = event.target.files;
        let paths: string[] = [];
        let i = 0;

        while (i < files.length) {
            paths.push(files[i++].path);
        }

        this.store.dispatch(publicationimportActions.fileImport(paths));
    }

    private closeCollectionDialog () {
        this.setState({opdsImportOpen: false});
    }

    private handleOpdsUrlChange (event: any) {
        this.setState({opdsUrl: event.target.value});
    }

    private downloadOPDS () {
        request(this.state.opdsUrl, (error: any, response: any, body: any) => {
        if (response && (
                response.statusCode < 200 || response.statusCode > 299)) {
            // Unable to download the resource
            console.error("Impossible de télécharger le flux OPDS HTTP ERROR");
            return;
        }

        if (error) {
            console.error("Impossible de télécharger le flux OPDS", error);
            return;
        }

        // A correct response has been received
        // So parse the feed and generate a catalog
        const opdsParser: OPDSParser = new OPDSParser();
        opdsParser
            .parse(body)
            .then((catalog: Catalog) => {
                this.setState({opdsCatalog: catalog});
            });
    });
    }
}
