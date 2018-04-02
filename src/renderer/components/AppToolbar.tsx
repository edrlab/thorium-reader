import * as React from "react";
import { Store } from "redux";

import Dialog from "material-ui/Dialog";
import Divider from "material-ui/Divider";
import DropDownMenu from "material-ui/DropDownMenu";
import FontIcon from "material-ui/FontIcon";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import Menu from "material-ui/Menu";
import MenuItem from "material-ui/MenuItem";
import Popover from "material-ui/Popover";
import { blue500 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "material-ui/Toolbar";

import FlatButton from "material-ui/FlatButton";

import { lazyInject } from "readium-desktop/renderer/di";

import { catalogActions } from "readium-desktop/common/redux/actions";
import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";
import { RootState } from "readium-desktop/renderer/redux/states";

import { UpdateStatus } from "readium-desktop/common/redux/states/update";

import * as classNames from "classnames";
import AddIcon from "readium-desktop/renderer/assets/icons/add.svg";
import GiftIcon from "readium-desktop/renderer/assets/icons/gift.svg";
import InfoIcon from "readium-desktop/renderer/assets/icons/info.svg";
import MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import OPDSIcon from "readium-desktop/renderer/assets/icons/opds.svg";
import QuestionIcon from "readium-desktop/renderer/assets/icons/question.svg";

import * as CNLLogoUrl from "readium-desktop/renderer/assets/logos/cnl.png";

import * as AppBarStyles from "readium-desktop/renderer/assets/styles/app-bar.css";

import CollectionDialog from "readium-desktop/renderer/components/opds/CollectionDialog";
import { Styles } from "readium-desktop/renderer/components/styles";

import { OPDS } from "readium-desktop/common/models/opds";

import { OpdsForm } from "readium-desktop/renderer/components/opds/index";

import * as deDocs from "readium-desktop/resources/docs/de";
import * as enDocs from "readium-desktop/resources/docs/en";
import * as frDocs from "readium-desktop/resources/docs/fr";

import {
    _APP_VERSION,
    _GIT_BRANCH,
    _GIT_DATE,
    _GIT_SHORT,
} from "readium-desktop/preprocessor-directives";

interface AppToolbarState {
    update: boolean;
    latestVersionUrl: string;
    locale: string;
    open: boolean;
    aboutOpen: boolean;
    dialogContent: string;
    opdsImportOpen: boolean;
    opdsUrl: string;
    opdsName: string;
    opds: OPDS;
    localeList: any;

    localeOpen: boolean;
    localAnchorEl: Element;
    opdsOpen: boolean;
    opdsAnchorEl: Element;
    otherOpen: boolean;
    otherAnchorEl: Element;
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
            update: false,
            latestVersionUrl: null,
            dialogContent: undefined,
            locale: this.store.getState().i18n.locale,
            open: false,
            aboutOpen: false,
            opdsImportOpen: false,
            opdsUrl: undefined,
            opdsName: undefined,
            opds: undefined,
            localeList: {
                fr: "Français",
                en: "English",
                de: "Deutsch",
            },

            localeOpen: false,
            localAnchorEl: undefined,
            opdsOpen: false,
            opdsAnchorEl: undefined,
            otherOpen: false,
            otherAnchorEl: undefined,
        };

        this.handleLocaleChange = this.handleLocaleChange.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
    }

    public componentDidMount() {
        this.store.subscribe(() => {
            const storeState = this.store.getState();

            if (
                storeState.update.status === UpdateStatus.Update ||
                storeState.update.status === UpdateStatus.SecurityUpdate
            ) {
                this.setState({
                    update: true,
                    latestVersionUrl: storeState.update.latestVersionUrl,
                });
            }
        });
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);

        const actions = [
            <FlatButton
                label="Cancel"
                primary={true}
                onClick={this.handleClose.bind(this)}
            />,
        ];

        // Use en as default language
        let docs = enDocs;
        if (this.state.locale === "fr") {
            docs = frDocs;
        } else if (this.state.locale === "de") {
            docs = deDocs;
        }

        const helpContent = docs.help as any;
        const newsContent = docs.news as any;
        const aboutContent = docs.about as any;

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
                                opdsOpen: false,
                            });
                        }}
                    >
                    </MenuItem>,
                );
                i++;
            }
        }
        const allMenuItems: JSX.Element[] = [];

        allMenuItems.push(...listOPDS);
        allMenuItems.push(
            <Divider key={i}/>,
        );
        i++;
        allMenuItems.push(
            <MenuItem
                key={i}
                primaryText={__("opds.addMenu")}
                onClick={() => {
                        this.props.openDialog(
                            <OpdsForm closeDialog={this.props.closeDialog}/>,
                            null,
                            []);
                }}
            />,
        );
        i++;
        return (
            <div>
                <div className={AppBarStyles.root}>
                    <button
                        onClick={this.handleLocalOpen.bind(this)}
                        className={classNames(AppBarStyles.button, AppBarStyles.button_text)}
                    >
                        {this.state.localeList[this.state.locale]}
                    </button>
                    <Popover
                        open={this.state.localeOpen}
                        anchorEl={this.state.localAnchorEl}
                        anchorOrigin={{horizontal: "left", vertical: "bottom"}}
                        targetOrigin={{horizontal: "left", vertical: "top"}}
                        onRequestClose={this.handleLocalClose.bind(this)}
                    >
                        <Menu>
                            <MenuItem
                                primaryText= {__("Français")}
                                onClick={() => {this.handleLocaleChange("fr"); }}
                            />
                            <MenuItem
                                primaryText= {__("English")}
                                onClick={() => {this.handleLocaleChange("en"); }}
                            />
                            <MenuItem
                                primaryText= {__("Deutsch")}
                                onClick={() => {this.handleLocaleChange("de"); }}
                            />
                        </Menu>
                    </Popover>
                    <div className={AppBarStyles.button_group}>
                        {this.state.update && (
                                <React.Fragment>
                                    <a
                                        href="{this.state.latestVersionUrl}"
                                        className={AppBarStyles.update}>
                                        {__("update.available")}
                                    </a>
                                    <div className={AppBarStyles.separator} />
                                </React.Fragment>
                            )
                        }
                        <button
                            className={AppBarStyles.button}
                            onClick={this.handleOpdsOpen.bind(this)}
                        >
                            <svg viewBox={OPDSIcon.content_table}>
                                <title>Menu</title>
                                <use xlinkHref={"#" + OPDSIcon.id} />
                            </svg>
                        </button>
                        <Popover
                            open={this.state.opdsOpen}
                            anchorEl={this.state.opdsAnchorEl}
                            anchorOrigin={{horizontal: "left", vertical: "bottom"}}
                            targetOrigin={{horizontal: "left", vertical: "top"}}
                            onRequestClose={this.handleOpdsClose.bind(this)}
                        >
                            <Menu>
                                {allMenuItems}
                            </Menu>
                        </Popover>
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
                        <button
                            className={AppBarStyles.button}
                            onClick={this.handleOtherOpen.bind(this)}
                        >
                            <svg viewBox={MenuIcon.content_table}>
                                <title>Menu</title>
                                <use xlinkHref={"#" + MenuIcon.id} />
                            </svg>
                        </button>
                        <Popover
                            open={this.state.otherOpen}
                            anchorEl={this.state.otherAnchorEl}
                            anchorOrigin={{horizontal: "left", vertical: "bottom"}}
                            targetOrigin={{horizontal: "left", vertical: "top"}}
                            onRequestClose={this.handleOtherClose.bind(this)}
                        >
                            <Menu>
                                <MenuItem
                                    primaryText= {__("toolbar.help")}
                                    onClick={ this.handleOpen.bind(this, helpContent, []) }
                                    leftIcon={
                                        <svg viewBox={QuestionIcon.content_table}>
                                            <title>Help</title>
                                            <use xlinkHref={"#" + QuestionIcon.id} />
                                        </svg>
                                    } />
                                <MenuItem
                                    primaryText={__("toolbar.news")}
                                    onClick={ this.handleOpen.bind(this, newsContent, []) }
                                    leftIcon={
                                        <svg viewBox={GiftIcon.content_table}>
                                            <title>What's up</title>
                                            <use xlinkHref={"#" + GiftIcon.id} />
                                        </svg>
                                    } />
                                <MenuItem
                                    primaryText={__("toolbar.about")}
                                    onClick={
                                        this.handleOpen.bind(
                                            this,
                                            aboutContent, [
                                                {
                                                    from: "{{version}}",
                                                    to: _APP_VERSION,
                                                },
                                                {
                                                    from: "{{date}}",
                                                    to: _GIT_DATE,
                                                },
                                                {
                                                    from: "{{short}}",
                                                    to: _GIT_SHORT,
                                                },
                                                {
                                                    from: "{{branch}}",
                                                    to: _GIT_BRANCH,
                                                },
                                                {
                                                    from: "{{cnlLogoUrl}}",
                                                    to: CNLLogoUrl,
                                                },
                                            ],
                                        )
                                    }
                                    leftIcon={
                                        <svg viewBox={InfoIcon.content_table}>
                                            <title>About</title>
                                            <use xlinkHref={"#" + InfoIcon.id} />
                                        </svg>
                                    } />
                            </Menu>
                        </Popover>
                    </div>
                </div>

                <Dialog
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose.bind(this)}
                    autoScrollBodyContent={true}
                    >
                    <div dangerouslySetInnerHTML={{__html: this.state.dialogContent}} />
                </Dialog>
                <Dialog
                    actions={[(
                        <FlatButton
                            label="Cancel"
                            primary={true}
                            onClick={this.handleClose.bind(this)}
                        />
                    )]}
                    modal={false}
                    open={this.state.aboutOpen}
                    onRequestClose={this.handleClose.bind(this)}
                    autoScrollBodyContent={true}
                    >
                    <>

                    </>
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

    private handleLocalOpen(event: any) {
        this.setState({localAnchorEl: event.currentTarget, localeOpen: true});
    }

    private handleLocalClose() {
        this.setState({localeOpen: false});
    }

    private handleOpdsOpen(event: any) {
        this.setState({opdsAnchorEl: event.currentTarget, opdsOpen: true});
    }

    private handleOpdsClose() {
        this.setState({opdsOpen: false});
    }

    private handleOtherOpen(event: any) {
        this.setState({otherAnchorEl: event.currentTarget, otherOpen: true});
    }

    private handleOtherClose() {
        this.setState({otherOpen: false});
    }

    private handleOpen = (content: string, replacements: any) => {
        for (const replacement of replacements) {
            content = content.replace(replacement.from, replacement.to);
        }

        this.setState({open: true});
        this.setState({dialogContent : content, otherOpen: false});
    }

    private handleClose = () => {
        this.setState({open: false});
    }

    private handleLocaleChange(locale: string) {
        this.store.dispatch(setLocale(locale));
        this.setState({locale, localeOpen: false});
    }

    private handleFileChange(event: any) {
        const files: FileList = event.target.files;

        for (const file of Array.from(files)) {
            this.store.dispatch(catalogActions.importFile(file.path));
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
