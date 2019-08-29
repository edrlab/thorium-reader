// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { RootState } from "readium-desktop/renderer/redux/states";

import { OpdsPublicationView } from "readium-desktop/common/views/opds";

import { withApi } from "./api";

import { ImportState } from "readium-desktop/common/redux/states/import";

interface Props  {
    lastImport?: ImportState;
    displayImportDialog?: any;
    search?: any;
    searchResult?: any;
    importOpdsEntry?: any;
    downloads?: any[];
}

class SameFileImportManager extends React.Component<Props> {
    public componentDidUpdate(oldProps: Props) {
        const { searchResult, lastImport, downloads } = this.props;

        if (searchResult !== oldProps.searchResult) {
            if (searchResult.length === 0) {
                this.importOpds();
            } else {
                this.props.displayImportDialog(lastImport.publication, lastImport.downloadSample );
            }
        }

        if (lastImport !== oldProps.lastImport) {
            const foundInCurrentDownload = downloads.findIndex(
                (value) => {
                    return value.publicationTitle === lastImport.publication.title;
                },
            );
            if (foundInCurrentDownload === -1) {
                this.props.search({text: lastImport.publication.title});
            } else {
                this.props.displayImportDialog(lastImport.publication, lastImport.downloadSample );
            }
        }
    }

    public render(): React.ReactElement<{}> {
        return (<></>);
    }

    private importOpds() {
        const { lastImport } = this.props;

        this.props.importOpdsEntry(
            {
                url: lastImport.publication.url,
                base64OpdsPublication: lastImport.publication.base64OpdsPublication,
                downloadSample: lastImport.downloadSample,
                title: lastImport.publication.title,
            },
        );
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        displayImportDialog: (publication: OpdsPublicationView, downloadSample: boolean) => {
            dispatch(dialogActions.open(
                DialogType.SameFileImportConfirm,
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

export default withApi(
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
);
