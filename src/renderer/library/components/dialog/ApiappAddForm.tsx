// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
// import { connect } from "react-redux";
// import { DialogTypeName } from "readium-desktop/common/models/dialog";
// import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
// import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
// import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
// import {
//     TranslatorProps, withTranslator,
// } from "readium-desktop/renderer/common/components/hoc/translator";
// import { apiAction } from "readium-desktop/renderer/library/apiAction";
// import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
// import { TDispatch } from "readium-desktop/typings/redux";
// import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { DialogCloseButton, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { StateContextFactory, useStateContextChildren } from "readium-desktop/renderer/common/hooks/useStateContext";
import { nanoid } from "nanoid";

// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IBaseProps extends TranslatorProps {
// }
// // IProps may typically extend:
// // RouteComponentProps
// // ReturnType<typeof mapStateToProps>
// // ReturnType<typeof mapDispatchToProps>
// // eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
// }

// interface IState {
//     name: string | undefined;
//     url: string | undefined;
//     searchResultView: IApiappSearchResultView[];
//     selectSearchResult: IApiappSearchResultView | undefined;
//     query: string;
// }

// class ApiappAddForm extends React.Component<IProps, IState> {
//     // private focusRef: React.RefObject<HTMLInputElement>;
//     private inputRef: React.RefObject<HTMLInputElement>;

//     constructor(props: IProps) {
//         super(props);

//         // this.focusRef = React.createRef<HTMLInputElement>();
//         this.inputRef = React.createRef<HTMLInputElement>();

//         this.state = {
//             name: undefined,
//             url: undefined,
//             searchResultView: [],
//             selectSearchResult: undefined,
//             query: "",
//         };
//     }

//     public componentDidMount() {
//         if (this.inputRef?.current) {
//             this.inputRef.current.focus();
//         }
//     }

//     public render(): React.ReactElement<{}> {
//         // if (!this.props.open) {
//         //     return (<></>);
//         // }

//         const { __ } = this.props;
//         const listItems = this.state.searchResultView.map((v, idx) =>
//             <li key={idx.toString()}>
//                 <a style={{
//                     display: "block",
//                     cursor: "pointer",
//                     padding: "8px",
//                     marginTop: "1rem",
//                     backgroundColor: this.state.selectSearchResult === v ? "#DDDDDD" : "transparent",
//                     border: this.state.selectSearchResult === v ? "2px solid black" : "2px solid transparent",
//                     borderRadius: "8px",
//                 }}
//                     role="option"
//                     aria-selected={this.state.selectSearchResult === v}
//                     tabIndex={0}
//                     onClick={() => this.setState({ selectSearchResult: v })}
//                     onDoubleClick={(e) => {
//                         this.setState({ selectSearchResult: v });
//                         setTimeout(() => {
//                             this.addDoubleClick(e);
//                         }, 0);
//                     }}
//                     onKeyDown={(e) => {
//                         if (e.key === "Enter") {
//                             this.setState({ selectSearchResult: v });
//                             setTimeout(() => {
//                                 this.addDoubleClick(e);
//                             }, 0);

//                             // e.preventDefault();
//                             e.stopPropagation();
//                         }
//                     }}
//                 >
//                     <strong>
//                         {v.name}
//                     </strong>
//                     <br />
//                     <span>{v.address}</span>
//                 </a>
//             </li>);

//         return (
//             // <Dialog
//             //     id={stylesModals.opds_form_dialog}
//             //     title={__("opds.addFormApiapp.title")}
//             //     onSubmitButton={this.add}
//             //     submitButtonDisabled={false}
//             //     submitButtonTitle={__("opds.addForm.addButton")}
//             //     noCentering={true}
//             // >
//                 // <div style={{display:"flex", flexDirection: "column", width: "100%"}}>
//                 //     <div
//                 //         style={{ marginBottom: "0" }}
//                 //         className={stylesInputs.form_group}>
//                 //         <input
//                 //             ref={this.inputRef}
//                 //             type="search"
//                 //             id="apiapp_search"
//                 //             placeholder={__("header.searchPlaceholder")}
//                 //             onKeyDown={(e) => {
//                 //                 if (e.key === "Enter") {
//                 //                     this.search(undefined);
//                 //                     // e.preventDefault();
//                 //                     e.stopPropagation();
//                 //                 }
//                 //             }}
//                 //         />
//                 //         <button
//                 //             onClick={this.search}
//                 //             className={stylesButtons.button_primary_small}
//                 //             style={{ fontWeight: "bold" }}
//                 //             title={__("header.searchTitle")}
//                 //         >
//                 //             {__("header.searchPlaceholder")}<SVG ariaHidden={true} svg={magnifyingGlass} />
//                 //         </button>
//                 //     </div>
//                 //     <div >
//                 //         {
//                 //             listItems.length
//                 //                 ? <ul style={{
//                 //                     listStyle: "none",
//                 //                     padding: 0,
//                 //                     margin: 0,
//                 //                 }}>
//                 //                     {listItems}
//                 //                 </ul>
//                 //                 :
//                 //                 this.state.query ? __("apiapp.noLibraryFound", { name: this.state.query }) : <></>
//                 //         }
//                 //     </div>
//                 // </div>
//             // </Dialog>
//             <div style={{display:"flex", flexDirection: "column", width: "100%"}}>
//                 <div
//                     style={{ marginBottom: "0" }}
//                     className={stylesInputs.form_group}>
//                     <input
//                         ref={this.inputRef}
//                         type="search"
//                         id="apiapp_search"
//                         placeholder={__("header.searchPlaceholder")}
//                         onKeyDown={(e) => {
//                             if (e.key === "Enter") {
//                                 this.search(undefined);
//                                 // e.preventDefault();
//                                 e.stopPropagation();
//                             }
//                         }}
//                     />
//                     <button
//                         onClick={this.search}
//                         className={stylesButtons.button_primary_small}
//                         style={{ fontWeight: "bold" }}
//                         title={__("header.searchTitle")}
//                     >
//                         {__("header.searchPlaceholder")}<SVG ariaHidden={true} svg={magnifyingGlass} />
//                     </button>
//                 </div>
//                 <div >
//                     {
//                         listItems.length
//                             ? <ul style={{
//                                 listStyle: "none",
//                                 padding: 0,
//                                 margin: 0,
//                             }}>
//                                 {listItems}
//                             </ul>
//                             :
//                             this.state.query ? __("apiapp.noLibraryFound", { name: this.state.query }) : <></>
//                     }
//                 </div>
//             </div>
//         );
//     }

//     private addDoubleClick = (e: React.UIEvent) => {
//         e.preventDefault();
//         this.add();
//         this.props.closeDialog();
//     };

//     private add = () => {
//         if (!this.state.selectSearchResult?.name || !this.state.selectSearchResult?.id || !this.state.selectSearchResult?.url) {
//             return;
//         }
//         const title = this.state.selectSearchResult.name;
//         const url = `apiapp://${this.state.selectSearchResult.id}:apiapp:${this.state.selectSearchResult.url}`;
//         apiAction("opds/addFeed", { title, url }).catch((err) => {
//             console.error("Error to fetch api opds/addFeed", err);
//         });
//     };

//     private search: React.MouseEventHandler<HTMLButtonElement> = (e) => {
//         e?.preventDefault(); // undefined on enter keydown input search

//         const value = this.inputRef?.current?.value;
//         this.setState({ query: "" });

//         if (value && typeof value === "string") {
//             apiAction("apiapp/search", value)
//                 .then((searchResultView) => {
//                     this.setState({ searchResultView });
//                     this.setState({ query: value });
//                 })
//                 .catch((error) => console.error("Error to fetch api apiapp/search", error));

//         }
//     };
// }

// const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
//     return {
//         closeDialog: () => {
//             dispatch(
//                 dialogActions.closeRequest.build(),
//             );
//         },
//     };
// };

// const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
//     open: state.dialog.type === DialogTypeName.ApiappAddForm,
// });

// export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ApiappAddForm));

const [myContext, useStateContext] = StateContextFactory<IApiappSearchResultView>();

const useAddFeedAction = () => {
    const [selectSearchResult] = useStateContextChildren(myContext);
    const [, addFeedAction] = useApi(undefined, "opds/addFeed");

    return () => {
        if (!selectSearchResult?.name || !selectSearchResult?.id || !selectSearchResult?.url) {
            return;
        }
        const title = selectSearchResult.name;
        const url = `apiapp://${selectSearchResult.id}:apiapp:${selectSearchResult.url}`;
        addFeedAction({title, url});
    }
}

const Item = ({v}: {v: IApiappSearchResultView}) => {

    const [selectSearchResult, setSelectSearchResult] = useStateContextChildren(myContext);
    const addFeedAction = useAddFeedAction();
    
    return <li>
                <a style={{
                    display: "block",
                    cursor: "pointer",
                    padding: "8px",
                    marginTop: "1rem",
                    backgroundColor: selectSearchResult === v ? "#DDDDDD" : "transparent",
                    border: selectSearchResult === v ? "2px solid black" : "2px solid transparent",
                    borderRadius: "8px",
                }}
                    role="option"
                    aria-selected={selectSearchResult === v}
                    tabIndex={0}
                    onClick={() => setSelectSearchResult(v)}
                    onDoubleClick={(e) => {
                        e.preventDefault();
                        setSelectSearchResult(v);
                        setTimeout(() => {
                            addFeedAction();
                        }, 0);
                    }}
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {
                            // e.preventDefault();
                            e.stopPropagation();
                            setSelectSearchResult(v);
                            setTimeout(() => {
                                addFeedAction();
                            }, 0);


                        }
                    }}
                >
                    <strong>
                        {v.name}
                    </strong>
                    <br />
                    <span>{v.address}</span>
                </a>
            </li>
}

const ApiappAddForm = () => {

    React.useEffect(() => {
        console.log("mount")
        return () => {
            console.log("kill")
        }
    })
    const [resultApiAppSearchAction, apiAppSearchAction] = useApi(undefined, "apiapp/search");
    const [query, ] = React.useState("");
    const [__] = useTranslator();
    const searchInputRef = React.useRef<HTMLInputElement>();
    const searchResultView = resultApiAppSearchAction?.data?.result || [];

    console.log("hello");

    const ItemListWithStyle = () => 
    <div>
        {
        searchResultView?.length ? <ul style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
        }}>
            {searchResultView.map((v) => <Item v={v} key={nanoid(10)}/>)}
        </ul>
        : query ? __("apiapp.noLibraryFound", { name: query }) : <></>
        }
    </div>

    const search = () => {
        const value = searchInputRef?.current?.value;

        if (value && typeof value === "string") {
            apiAppSearchAction(value);
        }
    }

    return (
        <div style={{display:"flex", flexDirection: "column", width: "100%"}}>
                <div
                    style={{ marginBottom: "0" }}
                    className={stylesInputs.form_group}>
                    <input
                        ref={searchInputRef}
                        type="search"
                        id="apiapp_search"
                        placeholder={__("header.searchPlaceholder")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                search();
                                // e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    />
                    <button
                        onClick={() => search()}
                        className={stylesButtons.button_primary_small}
                        style={{ fontWeight: "bold" }}
                        title={__("header.searchTitle")}
                    >
                        {__("header.searchPlaceholder")}<SVG ariaHidden={true} svg={magnifyingGlass} />
                    </button>
                </div>
                <ItemListWithStyle/>
            </div>
    )

}

export const ApiappAddFormContainer = () => {
    const [__] = useTranslator();
    const [,,StateContextComponent] = useStateContext();

    const AddButton = React.forwardRef<HTMLButtonElement>((props, ref) => {
        const addFeedAction = useAddFeedAction();
        return <button ref={ref} {...props} className={stylesButtons.button_secondary} onClick={() => addFeedAction()}>{__("opds.addForm.addButton")}</button>
    });

    React.useEffect(() => {
        console.log("mount parent")
        return () => {
            console.log("kill parent")
        }
    })

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {__("opds.addFormApiapp.title")}
                </DialogTitle>
                <div>
                    <DialogCloseButton />
                </div>
            </DialogHeader>
            <StateContextComponent>
                <ApiappAddForm />
                <DialogFooter>
                    <DialogClose asChild>
                        <button className={stylesButtons.button_primary}>{__("dialog.cancel")}</button>
                    </DialogClose>
                    <DialogClose asChild>
                        <AddButton />
                    </DialogClose>
                </DialogFooter>
            </StateContextComponent>
        </>
    )
}