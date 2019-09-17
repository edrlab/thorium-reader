// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { ImportOpdsPublication } from "readium-desktop/common/redux/states/import";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

class SameFileImportManager extends React.Component<IProps> {
    public componentDidUpdate(oldProps: IProps) {
        const { lastImport, downloads } = this.props;

        if (lastImport !== oldProps.lastImport) {
            if (downloads.findIndex((value) => value.url === lastImport.publication.url) < 0) {
                this.search();
            } else {
                this.props.displayImportDialog(lastImport.publication, lastImport.downloadSample );
            }
        }
    }

    public render(): React.ReactElement<{}> {
        return (<></>);
    }

    private search() {
        const { lastImport } = this.props;
        apiFetch("publication/search", lastImport.publication.title)
            .then((searchResult) => {
                if (searchResult && searchResult.length) {
                    this.props.displayImportDialog(lastImport.publication, lastImport.downloadSample);
                } else {
                    apiFetch("publication/importOpdsEntry",
                        lastImport.publication.url,
                        lastImport.publication.base64OpdsPublication,
                        lastImport.publication.title,
                        lastImport.downloadSample,
                    ).catch((error) => {
                        console.error(`Error to fetch api publication/importOpdsEntry`, error);
                    });
                }
            })
            .catch((e) => console.error("Error to fetch api publication/search", e));
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        displayImportDialog: (publication: ImportOpdsPublication, downloadSample: boolean) => {
            dispatch(dialogActions.open("same-file-import-confirm",
                {
                    publication,
                    downloadSample,
                },
            ));
        },
    };
};

const mapStateToProps = (state: RootState) => {
    return {
        lastImport: state.import,
        downloads: state.download.downloads,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(SameFileImportManager);
/*withApi(
    SameFileImportManager,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "importOpdsEntry",
                callProp: "importOpdsEntry",
            },
            {
                moduleId: "publication",
                methodId: "search",
                resultProp: "searchResult",
                callProp: "search",
            },
        ],
        mapStateToProps,
        mapDispatchToProps,
    },
);*/
