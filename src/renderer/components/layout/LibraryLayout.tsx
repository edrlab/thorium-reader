import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import LibraryHeader from "./LibraryHeader";

import { connect } from "react-redux";

import { RootState } from "readium-desktop/renderer/redux/states";

interface LibraryLayoutProps {
    dialogOpen?: boolean;
}

export class LibraryLayout extends React.Component<LibraryLayoutProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                <LibraryHeader />
                <main style={ this.props.dialogOpen ? {filter: "blur(1px)"} : {} } id={styles.main} role="main">
                    { this.props.children }
                </main>
            </>
        );
    }
}

const mapStateToProps = (state: RootState, ownProps: any) => {
    return {
        dialogOpen: state.dialog.open,
    };
};

export default connect(mapStateToProps)(LibraryLayout);
