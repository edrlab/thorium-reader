import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

interface FileImportProps extends TranslatorProps {
    files: any;
    importFiles?: any;
    closeDialog?: any;
}

export class FileImport extends React.Component<FileImportProps, undefined> {
    constructor(props: any) {
        super(props);
        this.importFiles = this.importFiles.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <div className={styles.add_dialog_content}>
                    { this.buildBasicFileImportList() }
                    { this.buildLcpFileImportList() }
                </div>
                <div className={styles.add_dialog_choices}>
                    <button onClick={ this.importFiles }
                    >
                        { this.props.__("dialog.yes") }
                    </button>
                    <button onClick={ this.props.closeDialog }>
                        { this.props.__("dialog.no") }
                    </button>
                </div>
            </div>
        );
    }

    private importFiles() {
        const paths = this.props.files.map((file: File) => {
            return file.path;
        });
        this.props.importFiles({ paths });
        this.props.closeDialog();
    }

    private buildBasicFileImportList() {
        const basicFiles = this.props.files.filter((file: any) => {
            const fileParts = file.name.split(".");
            return (fileParts.length > 1 && fileParts[1] !== "lcp");
        });

        if (basicFiles.length === 0) {
            return (<></>);
        }

        return (
            <div>
                <p>{ this.props.__("dialog.import") }</p>
                <ul>
                    {
                        basicFiles.map((file: File, i: number) => {
                            return (
                                <li key={ i }>{ file.name }</li>
                            );
                        })

                    }
                </ul>
            </div>
        );
    }

    private buildLcpFileImportList() {
        const lcpFiles = this.props.files.filter((file: any) => {
            const fileParts = file.name.split(".");
            return (fileParts.length > 1 && fileParts[1] === "lcp");
        });

        if (lcpFiles.length === 0) {
            return (<></>);
        }

        return (
            <div>
                <p>{ this.props.__("dialog.lcpImport") }</p>
                <ul>
                    {
                        lcpFiles.map((file: File, i: number) => {
                            return (
                                <li key={ i }>{ file.name }</li>
                            );
                        })

                    }
                </ul>
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch: any, ownProps: any) => {
    return {
        closeDialog: (data: any) => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default withApi(
    FileImport,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "import",
                callProp: "importFiles",
            },
        ],
        mapDispatchToProps,
    },
);
