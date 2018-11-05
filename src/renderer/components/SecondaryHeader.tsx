import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/header.css";

interface Props {
    style?: {};
}

export default class SecondaryHeader extends React.Component<Props, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <nav
                style={this.props.style}
                className={styles.nav_secondary}
                role="navigation"
                aria-label="Menu principal"
            >
                {this.props.children}
            </nav>
        );
    }
}
