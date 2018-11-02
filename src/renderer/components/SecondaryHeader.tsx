import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/header.css";

export default class SecondaryHeader extends React.Component<{}, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <nav className={styles.nav_secondary} role="navigation" aria-label="Menu principal">
                {this.props.children}
            </nav>
        );
    }
}
