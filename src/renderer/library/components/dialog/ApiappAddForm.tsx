// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TMouseEventOnInput } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

interface IState {
    name: string | undefined;
    url: string | undefined;
    searchResultView: IApiappSearchResultView[];
    query: string;
}

class ApiappAddForm extends React.Component<IProps, IState> {
    private focusRef: React.RefObject<HTMLInputElement>;
    private buttonRef: React.RefObject<HTMLButtonElement>;
    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.focusRef = React.createRef<HTMLInputElement>();
        this.buttonRef = React.createRef<HTMLButtonElement>();
        this.inputRef = React.createRef<HTMLInputElement>();

        this.search = this.search.bind(this);

        this.state = {
            name: undefined,
            url: undefined,
            searchResultView: [],
            query: "",
        };

        this.add = this.add.bind(this);
    }

    public componentDidMount() {
        if (this.focusRef?.current) {
            this.focusRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open) {
            return (<></>);
        }

        const { __, closeDialog } = this.props;
        const { name, url } = this.state;
        const listItems = this.state.searchResultView.map((v, idx) => <li key={idx.toString()}><b><a onClick={() => ({})}>{v.name}</a></b><p>{v.address}</p></li>);
        
        return (
            <Dialog
                open={true}
                close={closeDialog}
                id={stylesModals.opds_form_dialog}
                title={__("opds.addMenu")}
            >
                <form className={stylesModals.modal_dialog_form_wrapper}>
                    <div className={classNames(stylesModals.modal_dialog_body, stylesModals.modal_dialog_body_centered)}>
                        <div className={stylesGlobal.w_50}>
                            <div className={stylesInputs.form_group}>
                                {/* <form onSubmit={this.search} role="search"> */}
                                    <input
                                        ref={this.inputRef}
                                        type="search"
                                        id="apiapp_search"
                                        aria-label={__("accessibility.searchBook")}
                                        placeholder={__("header.searchPlaceholder")}
                                    />
                                <button
                                    onClick={this.search}
                                    className={stylesButtons.button_primary}
                                >
                                        <SVG svg={SearchIcon} title={__("header.searchTitle")} />
                                    </button>
                                    <div>

                                    </div>
                                    <ul>
                                        {
                                            listItems.length ? listItems : this.state.query ? __("apiapp.noLibraryFound", { name: this.state.query }) : <></>
                                        }
                                    </ul>
                                {/* </form> */}
                            </div>
                        </div>
                    </div>
                    <div className={stylesModals.modal_dialog_footer}>
                        <button
                            onClick={closeDialog}
                            className={stylesButtons.button_primary}
                        >
                            {__("opds.back")}
                        </button>
                        <button
                            disabled={!name || !url}
                            type="submit"
                            onClick={this.add}
                            className={stylesButtons.button_primary}
                            ref={this.buttonRef}
                        >
                            {__("opds.addForm.addButton")}
                        </button>
                    </div>
                </form>
            </Dialog>
        );
    }

    public add(e: TMouseEventOnInput) {
        e.preventDefault();
        const title = this.state.name;
        const url = this.state.url;
        apiAction("opds/addFeed", { title, url }).catch((err) => {
            console.error("Error to fetch api opds/addFeed", err);
        });
        this.props.closeDialog();
    }

    private search(e: any) {
        e.preventDefault();

        const value = this.inputRef?.current?.value;
        this.setState({ query: "" });

        if (value && typeof value === "string") {
            apiAction("apiapp/search", value)
                .then((searchResultView) => {
                    this.setState({ searchResultView });
                    this.setState({ query: value });
                })
                .catch((error) => console.error("Error to fetch api apiapp/search", error));

        }

    }

}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.ApiappAddForm,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ApiappAddForm));
