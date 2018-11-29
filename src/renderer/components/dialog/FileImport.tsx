import * as React from "react";

import { withTranslator, TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

interface FileImportProps extends TranslatorProps {
    files: any;
    importFiles?: any;
    closeDialog?: any;
}

export class FileImport extends React.Component<FileImportProps, undefined> {
    constructor(props: any) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <div className={styles.add_dialog_content}>
                    { this.buildBasicFileImportList() }
                    { this.buildLcpFileImportList() }
                </div>
                <div className={styles.add_dialog_choices}>
                    <button
                        onClick={
                            () => {
                                this.props.importFiles();
                                this.props.closeDialog();
                            }
                        }
                    >
                        { this.props.__("dialog.yes") }
                    </button>
                    <button
                        onClick={
                            () => {
                                this.props.closeDialog();
                            }
                        }
                    >
                        { this.props.__("dialog.no") }
                    </button>
                </div>
            </div>
        );
    }

    private buildBasicFileImportList() {
        const basicFiles = this.props.files.filter((file: File) => {
            const fileParts = file.name.split(".");
            return (fileParts.length > 1 && fileParts[1] != "lcp")
        });

        return (
            <div>
                <p>{ this.props.__("dialog.import") }</p>
                <ul>
                    {
                        basicFiles.map((file: File) => {
                            return (
                                <li>{ file.name }</li>
                            );
                        })

                    }
                </ul>
            </div>
        );
    }

    private buildLcpFileImportList() {
        const lcpFiles = this.props.files.filter((file: File) => {
            const fileParts = file.name.split(".");
            return (fileParts.length > 1 && fileParts[1] == "lcp")
        });

        return (
            <div>
                <p>{ this.props.__("dialog.lcpImport") }</p>
                <ul>
                    {
                        lcpFiles.map((file: File) => {
                            return (
                                <li>{ file.name }</li>
                            );
                        })

                    }
                </ul>
            </div>
        );
    }
}

export default withTranslator(FileImport)
