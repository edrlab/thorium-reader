// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

// import "readium-desktop/renderer/assets/styles/partials/variables.scss";
// import * as globalScssStyle from "readium-desktop/renderer/assets/styles/global.scss";
import "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";

import { webUtils } from "electron";
import classNames from "classnames";
import { HistoryRouter } from "redux-first-history/rr6";
import * as path from "path";
import * as React from "react";
import Dropzone, { DropEvent, DropzoneRootProps } from "react-dropzone";
import { Provider } from "react-redux";
import { acceptedExtension, acceptedExtensionObject } from "readium-desktop/common/extension";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import ToastManager from "readium-desktop/renderer/common/components/toast/ToastManager";
import { ensureKeyboardListenerIsInstalled } from "readium-desktop/renderer/common/keyboard";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import DialogManager from "readium-desktop/renderer/library/components/dialog/DialogManager";
import PageManager from "readium-desktop/renderer/library/components/PageManager";
import DownloadsPanel from "./DownloadsPanel";
import LoaderMainLoad from "./LoaderMainLoad";
import { customizationActions, toastActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";

import { acceptedExtensionArray } from "readium-desktop/common/extension";
import Nunito from "readium-desktop/renderer/assets/fonts/NunitoSans_10pt-Regular.ttf";
import NunitoBold from "readium-desktop/renderer/assets/fonts/NunitoSans_10pt-SemiBold.ttf";

import { WizardModal } from "./Wizard";
import { getReduxHistory, getStore } from "../createStore";
import { getTranslator } from "readium-desktop/common/services/translator";
import { CustomizationProfileModal } from "readium-desktop/renderer/common/components/customizationProfileModal";
// eslintxx-disable-next-line @typescript-eslint/no-unused-expressions
// globalScssStyle.__LOAD_FILE_SELECTOR_NOT_USED_JUST_TO_TRIGGER_WEBPACK_SCSS_FILE__;

export default class App extends React.Component<{}, undefined> {

    constructor(props: {}) {
        super(props);

        this.onDrop = this.onDrop.bind(this);
    }

    getFiles = async (event: DropEvent): Promise<Array<File>> => {
        if (!(event as React.DragEvent<HTMLElement>).dataTransfer?.files) {
            return [];
        }
        const files = Array.from((event as React.DragEvent<HTMLElement>).dataTransfer.files);
        // console.log("getFiles: " + files.length);
        // console.log("getFile: " + files[0]);
        // const absolutePath = webUtils.getPathForFile(files[0]);
        // console.log("absolutePath zz: " + absolutePath);
        return files;
    };

    // Called when files are droped on the dropzone
    public onDrop(acceptedFiles: File[]) {
        const store = getStore();

        console.log("Drag-on-Drop: acceptedFiles", acceptedFiles);

        const filez = acceptedFiles
            .filter(
                (file) => {
                    // with drag-and-drop (unlike input@type=file) the File `path` property is equal to `name`!
                    // const absolutePath = file.path ? file.path : webUtils.getPathForFile(file);
                    const absolutePath = webUtils.getPathForFile(file);
                    // console.log("absolutePath 1: " + absolutePath);
                    return absolutePath.replace(/\\/g, "/").toLowerCase().endsWith("/" + acceptedExtensionObject.nccHtml) || acceptedExtension(path.extname(absolutePath));
                },
            )
            .map(
                (file) => {
                    // with drag-and-drop (unlike input@type=file) the File `path` property is equal to `name`!
                    // const absolutePath = file.path ? file.path : webUtils.getPathForFile(file);
                    const absolutePath = webUtils.getPathForFile(file);
                    // console.log("absolutePath 2: " + absolutePath);
                    return {
                        name: file.name,
                        path: absolutePath,
                    };
                },
            );

        if (filez.length === 0) {
            const file = acceptedFiles[0];
            // with drag-and-drop (unlike input@type=file) the File `path` property is equal to `name`!
            // const absolutePath = file.path ? file.path : webUtils.getPathForFile(file);
            const absolutePath = webUtils.getPathForFile(file);
            // console.log("absolutePath 3: " + absolutePath);


            if (path.extname(absolutePath) === ".thor") {

                console.log("dispatch thorium customization filePath: copy, provisions and activates profile =>", absolutePath);
                store.dispatch(customizationActions.acquire.build(absolutePath));
                return ;
            }


            const acceptedExtension = acceptedFiles.length === 1 ? `[${path.extname(absolutePath)}] ${acceptedExtensionArray.join(" ")}` : acceptedExtensionArray.join(" ");
            store.dispatch(toastActions.openRequest.build(ToastType.Error, getTranslator().__("dialog.importError", {
                acceptedExtension,
            })));
            return;
        }

        if (filez.length <= 5) {
            const paths = filez.map((file) => {
                // console.log("absolutePath 4: " + file.path);
                return file.path;
            });
            apiAction("publication/importFromFs", paths).catch((error) => {
                console.error("Error to fetch publication/importFromFs", error);
            });
            return;
        }

        store.dispatch(
            dialogActions.openRequest.build(
                DialogTypeName.FileImport,
                {
                    files: filez,
                },
            ));
    }

    public async componentDidMount() {
        ensureKeyboardListenerIsInstalled();

        const store = getStore();
        document.body.setAttribute("data-theme", store.getState().theme.name);
    }

    public render(): React.ReactElement<{}> {

        // FIXME: try a better way to import Nunito in CSS font face instead of in React render function.
        // One possibility is to add css font in ejs html template file from webpack
        try {
            const nunitoFontStyleID = "nunitoFontStyleID";
            const el = document.getElementById(nunitoFontStyleID);
            if (!el) {
                const css = `
        @font-face {
            font-family: "Nunito";
            font-style: normal;
            font-weight: normal;
            src: local("Nunito"),
            url("${Nunito}") format("truetype");
        }
        @font-face {
            font-family: "Nunito";
            font-style: bold;
            font-weight: 700;
            src: local("NunitoBold"),
            url("${NunitoBold}") format("truetype");
        }

                `;
                const el = document.createElement("style");
                el.setAttribute("id", nunitoFontStyleID);
                el.setAttribute("type", "text/css");
                el.appendChild(document.createTextNode(css));
                document.head.appendChild(el);
            }

            // const js = `console.log("DROP"); document.getElementsByTagName("body")[0].addEventListener("dragover", (event) => {
            //     event.preventDefault();
            //   });
            //   document.getElementsByTagName("body")[0].addEventListener("drop", (ev) => {
            //     ev.preventDefault();
            //       console.log(ev.dataTransfer.files[0]);
            //       console.log(ev.dataTransfer.files[0].name);
            //       console.log(ev.dataTransfer.files[0].path);
            //       console.log(require("electron").webUtils.getPathForFile(ev.dataTransfer.files[0]));
            //   });`;
            //   if (!document.getElementById("jsdrop")) {
            //   const eljs = document.createElement("script");
            //   eljs.setAttribute("id", "jsdrop");
            //   eljs.setAttribute("type", "text/javascript");
            //   eljs.appendChild(document.createTextNode(js));
            //   document.body.appendChild(eljs);
            //   }

        } catch (e) {
            console.error("Nunito font face error", e);
        }

        return (
            <Provider store={getStore()} >
                <TranslatorContext.Provider value={getTranslator()}>
                    <HistoryRouter history={getReduxHistory()}>
                        <Dropzone
                            getFilesFromEvent={this.getFiles}
                            onDrop={this.onDrop}
                            noClick={true}
                        >
                            {({ getRootProps, getInputProps }) => {
                                const rootProps = getRootProps({ onClick: (e) => e.stopPropagation() } as DropzoneRootProps);
                                const inputProps = getInputProps({ onClick: (evt) => evt.preventDefault() });
                                rootProps.tabIndex = -1;
                                return <div
                                    {...rootProps}
                                    className={classNames(stylesInputs.dropzone)}
                                    onFocus={null}
                                    onBlur={null}
                                >
                                    <DownloadsPanel />
                                    <input aria-hidden {
                                        ...inputProps
                                    }
                                    />
                                    <PageManager />
                                    <DialogManager />
                                    <LoaderMainLoad />
                                    <ToastManager />
                                    <WizardModal />
                                    <CustomizationProfileModal />
                                </div>;
                            }}
                        </Dropzone>
                    </HistoryRouter>
                </TranslatorContext.Provider>
            </Provider>
        );
    }
}
