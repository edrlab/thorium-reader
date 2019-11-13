// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as commonmark from "commonmark";
import { readFile } from "fs";
import * as path from "path";
import * as React from "react";
import { connect } from "react-redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { i18nActions } from "readium-desktop/common/redux/actions/";
import { _PACKAGING } from "readium-desktop/preprocessor-directives";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { promisify } from "util";

import Dialog from "../dialog/Dialog";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

interface IState {
    placeholder: any;
}

export class Information extends React.Component<IProps, IState> {
    private parsedMarkdown: string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            placeholder: undefined,
        };
    }

    public async componentDidMount() {
        const { locale } = this.props;
        const infoFolderRelativePath = "assets/md/information";

        let folderPath: string = path.join((global as any).__dirname, infoFolderRelativePath);
        try {
            if (_PACKAGING === "0") {
                folderPath = path.join(process.cwd(), "dist", infoFolderRelativePath);
            }
            const fileContent = await promisify(readFile)(path.join(folderPath, `${locale}.md`), {encoding: "utf8"});
            this.parsedMarkdown = (new commonmark.HtmlRenderer()).render((new commonmark.Parser()).parse(fileContent));
        } catch (__) {
            this.parsedMarkdown = "<h1>There is no information for your language</h1>";
        }
        this.forceUpdate();
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open) {
            return (<></>);
        }

        const html = { __html: this.parsedMarkdown };
        return (
            <Dialog open={true} close={this.props.closeDialog}>
                <div dangerouslySetInnerHTML={html}></div>
            </Dialog>
        );
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
        open: state.dialog.type === "about-thorium",
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setLocale: (locale: string) => dispatch(i18nActions.setLocale.build(locale)),
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Information));
