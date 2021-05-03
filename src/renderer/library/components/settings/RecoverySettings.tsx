// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { i18nActions } from "readium-desktop/common/redux/actions/";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import SVG from "../../../common/components/SVG";
import { promises as fsp } from "fs";
import { ipcRenderer } from "electron";
import * as path from "path";
import { _CONTINUOUS_INTEGRATION_DEPLOY, _NODE_ENV } from "readium-desktop/preprocessor-directives";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    recovery: string[];
    name: string;
};

class RecoverySettings extends React.Component<IProps, IState> {
    configDataFolderPath: string;
    recoveryFilePath: string;

    constructor(props: IProps) {
        super(props);
        this.state = {
            recovery: [],
            name: "",
        };
        ipcRenderer.on("GETPATH", async (_0: any, userDataPath: string) => {

            try {
                this.configDataFolderPath = path.join(
                    userDataPath,
                    `config-data-json${(_NODE_ENV === "development" || _CONTINUOUS_INTEGRATION_DEPLOY) ? "-dev" : ""}`,
                );
                const RECOVERY_FILENAME = "recovery";
                this.recoveryFilePath = path.join(
                    this.configDataFolderPath,
                    RECOVERY_FILENAME,
                );
                await this.getRecoveryState();

            } catch (e) {
                // ignore
                console.error(e);

            }
        });
    }

    public render(): React.ReactElement<{}> {
        // const { __ } = this.props;

        return (
            <>
                <h3>{"Select a recovery file"}</h3>
                <h5>{"Be careful"}</h5>
                <form className={styles.languages_list}>
                    {this.state.recovery.map((date, i) =>
                        <div key={i}>
                            <input
                                id={"radio-" + date}
                                type="radio"
                                name="language"
                                onChange={() => this.setRecoveryFile(date)}
                                checked={this.state.name === date}
                            />
                            <label htmlFor={"radio-" + date}>
                                {this.state.name === date && <SVG svg={DoneIcon} ariaHidden />}
                                {date ? new Date(parseInt(date, 10)).toString().split("GMT")[0] : "actual state"}
                            </label>
                        </div>,
                    )}
                </form>
            </>
        );
    }

    private getRecoveryState = async () => {

        try {

            const files = await fsp.readdir(this.configDataFolderPath);
            console.log(files);

            const recoveryString = files
                .map((v) => {
                    const res = /^state.([0-9].*).json/.exec(v);
                    if (Array.isArray(res)) return res[1];
                    return undefined;
                })
                .filter((v) => !!v)
                .map((v) => {
                    try {
                        new Date(parseInt(v, 10)).toString();
                        return v;
                    } catch {
                        return undefined;
                    }
                })
                .filter((v) => !!v);
            recoveryString.push("");

            this.setState({
                recovery: recoveryString.reverse(),
            });

            console.log(recoveryString);


        } catch {
            // ignore
        }

    };

    private setRecoveryFile = async (name: string) => {

        try {

            const filename = name ? `state.${name}.json` : "";
            await fsp.writeFile(this.recoveryFilePath, filename, { encoding: "utf8" });

            this.setState({
                name,
            });

        } catch {
            // ignore
        }
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        locale: state.i18n.locale,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setLocale: (locale: string) => dispatch(i18nActions.setLocale.build(locale)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(RecoverySettings));
