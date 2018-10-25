import * as React from "react";

interface Props {
    svg: any;
    title?: string;
}

export default class SVG extends React.Component<Props, null> {
    public render(): React.ReactElement<{}>  {
        const svg = this.props.svg;
        return (
            <svg viewBox={svg.default.viewBox}>
                { this.props.title &&
                    <title>{this.props.title}</title>
                }
                <use xlinkHref={"#" + svg.default.id} />
            </svg>
        );
    }
}
