import * as commonmark from "commonmark";
import * as fs from "fs";
import * as React from "react";
import { Store } from "redux";

import Dialog from "material-ui/Dialog";
import Divider from "material-ui/Divider";
import DropDownMenu from "material-ui/DropDownMenu";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import { blue500 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "material-ui/Toolbar";

import FlatButton from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import { catalogActions } from "readium-desktop/common/redux/actions";
import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";
import { RootState } from "readium-desktop/renderer/redux/states";

import * as classNames from "classnames";
import AddIcon from "readium-desktop/renderer/assets/icons/add.svg";
import GiftIcon from "readium-desktop/renderer/assets/icons/gift.svg";
import MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import OPDSIcon from "readium-desktop/renderer/assets/icons/opds.svg";
import QuestionIcon from "readium-desktop/renderer/assets/icons/question.svg";
import * as AppBarStyles from "readium-desktop/renderer/assets/styles/app-bar.css";

import CollectionDialog from "readium-desktop/renderer/components/opds/CollectionDialog";
import { Styles } from "readium-desktop/renderer/components/styles";

import { OPDS } from "readium-desktop/common/models/opds";

import { OpdsForm } from "readium-desktop/renderer/components/opds/index";

interface AppToolbarState {
    locale: string;
    open: boolean;
    dialogContent: string;
    opdsImportOpen: boolean;
    opdsUrl: string;
    opdsName: string;
    opds: OPDS;
    localeList: any;
}

interface AppToolbarProps {
    openDialog: (content: JSX.Element, stuff: any, things: any[]) => void;
    closeDialog: () => void;
    opdsList: OPDS[];
}

export default class AppToolbar extends React.Component<AppToolbarProps, AppToolbarState> {
    public state: AppToolbarState;

    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor(props: AppToolbarProps) {
        super(props);
        this.state = {
            dialogContent: undefined,
            locale: this.store.getState().i18n.locale,
            open: false,
            opdsImportOpen: false,
            opdsUrl: undefined,
            opdsName: undefined,
            opds: undefined,
            localeList: {
                fr: "Français",
                en: "English",
            },
        };

        this.handleLocaleChange = this.handleLocaleChange.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);

        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.handleClose}
            />,
        ];

        const that = this;
        const helpUrl = "./src/resources/docs/" + this.state.locale + "/help.md";
        const aboutUrl = "./src/resources/docs/" + this.state.locale + "/about.md";

        const listOPDS: JSX.Element[] = [];
        let i = 0;
        if (this.props.opdsList !== undefined) {
            for (const newOpds of this.props.opdsList.sort(this.sort)) {
                listOPDS.push(
                    <MenuItem
                        key= {i}
                        primaryText={newOpds.name}
                        onClick={() => {
                            this.setState({
                                opdsImportOpen: true,
                                opds: newOpds,
                            });
                        }}
                    >
                    </MenuItem>,
                );
                i++;
            }
        }
        const allMenuItems: JSX.Element[] = [];
        // for (let item of listOPDS) {
        //     allMenuItems.push(item);
        // }
        allMenuItems.push(...listOPDS);
        allMenuItems.push(
            <Divider
                key= {i}/>,
        );
        i++;
        allMenuItems.push(
            <MenuItem
                key= {i}
                primaryText={__("opds.addMenu")}
                onClick={() => {
                        this.props.openDialog(
                            <OpdsForm closeDialog={this.props.closeDialog}/>,
                            null,
                            []);
                }}/>,
        );
        i++;
        return (
            <div>
                <div className={AppBarStyles.root}>
                    <IconMenu
                        iconButtonElement={
                            <button className={classNames(AppBarStyles.button, AppBarStyles.button_text)}>
                                {this.state.localeList[this.state.locale]}
                            </button>
                        }
                    >
                        <MenuItem
                            primaryText= {__("Français")}
                            onClick={() => {this.handleLocaleChange("fr"); }}
                        />
                        <MenuItem
                            primaryText= {__("English")}
                            onClick={() => {this.handleLocaleChange("en"); }}
                        />
                    </IconMenu>
                    <div className={AppBarStyles.button_group}>
                        <IconMenu
                            iconButtonElement={
                                <button
                                    className={AppBarStyles.button}
                                >
                                    <svg viewBox={OPDSIcon.content_table}>
                                        <title>Menu</title>
                                        <use xlinkHref={"#" + OPDSIcon.id} />
                                    </svg>
                                </button>
                            }
                        >
                            {allMenuItems}
                        </IconMenu>
                        <button
                            className={AppBarStyles.button}
                        >
                            <svg viewBox={AddIcon.content_table}>
                                <title>Add EPUB</title>
                                <use xlinkHref={"#" + AddIcon.id} />
                            </svg>
                            <input
                                type="file"
                                onChange={this.handleFileChange}
                            />
                        </button>
                        <div className={AppBarStyles.separator} />
                        <IconMenu
                            iconButtonElement={
                                <button
                                    className={AppBarStyles.button}
                                >
                                    <svg viewBox={MenuIcon.content_table}>
                                        <title>Menu</title>
                                        <use xlinkHref={"#" + MenuIcon.id} />
                                    </svg>
                                </button>
                            }
                        >
                            <MenuItem
                                primaryText= {__("toolbar.help")}
                                onClick={() => {
                                    that.handleOpen(helpUrl);
                                }}
                                leftIcon={
                                    <svg viewBox={QuestionIcon.content_table}>
                                        <title>Help</title>
                                        <use xlinkHref={"#" + QuestionIcon.id} />
                                    </svg>
                                } />
                            <MenuItem
                                primaryText={__("toolbar.news")}
                                onClick={() => {
                                    that.handleOpen(aboutUrl);
                                }}
                                leftIcon={
                                    <svg viewBox={GiftIcon.content_table}>
                                        <title>What's up</title>
                                        <use xlinkHref={"#" + GiftIcon.id} />
                                    </svg>
                                } />
                        </IconMenu>
                    </div>
                </div>

                <Dialog
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}
                    autoScrollBodyContent={true}
                    >
                    <div dangerouslySetInnerHTML={{__html: this.state.dialogContent}} />
                </Dialog>
                {this.state.opdsImportOpen ? (
                    <CollectionDialog
                        open={this.state.opdsImportOpen}
                        closeList={this.closeCollectionDialog.bind(this)}
                        opds={this.state.opds}
                        openDialog={this.props.openDialog}
                        closeDialog={this.props.closeDialog}
                        updateDisplay={this.updateDisplay.bind(this)}/>
                ) : (
                    <div></div>
                )
                }
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

    private handleLocaleChange(locale: string) {
        this.store.dispatch(setLocale(locale));
        this.setState({locale});
    }

    private handleFileChange(event: any) {
        const files: FileList = event.target.files;

        for (const file of Array.from(files)) {
            this.store.dispatch(catalogActions.importLocalPublication(file.path));
        }
    }

    private closeCollectionDialog() {
        this.setState({opdsImportOpen: false});
    }

    private sort(a: OPDS, b: OPDS) {
        if (a.name > b.name) {
            return 1;
        } else if (a.name === b.name) {
            return 0;
        } else {
            return -1;
        }
    }

    private updateDisplay(newOpds: OPDS) {
        this.setState({opds: newOpds});
    }
}
