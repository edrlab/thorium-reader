import * as React from "react";

interface MenuButtonProps {
    menuId: string;
    open: boolean;
}

export default class Header extends React.Component<MenuButtonProps, undefined> {
    public constructor(props: any) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        return (
            <button
                aria-expanded={this.props.open}
                aria-controls={this.props.menuId}
            >
                {this.props.children}
            </button>
        );
    }
}
