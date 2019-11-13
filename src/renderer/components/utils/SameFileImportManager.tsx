// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { apiAction } from "readium-desktop/renderer/apiAction";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class SameFileImportManager extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public componentDidUpdate(oldProps: IProps) {
        const { importState, downloadState } = this.props;

        if (importState !== oldProps.importState) {

            if (downloadState &&
                downloadState.downloads &&
                // tslint:disable-next-line: max-line-length
                !downloadState.downloads.find((dl) => dl.url === importState.opdsPublicationView.openAccessUrl || dl.url === importState.opdsPublicationView.sampleOrPreviewUrl)) {

                apiAction("publication/importOpdsEntry",
                    importState.opdsPublicationView.entryUrl,
                    importState.opdsPublicationView.r2OpdsPublicationBase64,
                    importState.opdsPublicationView.baseUrl,
                ).catch((error) => {
                    console.error(`Error to fetch api publication/importOpdsEntry`, error);
                });
            } else {
                this.props.toastAlreadyImport(importState.opdsPublicationView.title);
            }
        }
    }

    public render(): React.ReactElement<{}> {
        return (<></>);
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => {
    return {
        importState: state.import,
        downloadState: state.download,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        toastAlreadyImport: (title: string | undefined) => {
            dispatch(
                toastActions.openRequest.build(ToastType.Success, props.translator.translate("message.import.alreadyImport", { title })),
            );
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(SameFileImportManager));
