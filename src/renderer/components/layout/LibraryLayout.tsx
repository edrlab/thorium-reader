import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import LibraryHeader from "./LibraryHeader";

export default class LibraryLayout extends React.Component<any, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                <LibraryHeader />
                <main id={styles.main} role="main">
                    { this.props.children }
                </main>
            </>
        );
    }
}
