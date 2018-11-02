import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/slider.css";

import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface Props {
    content: JSX.Element[];
    displayQty: number;
    className?: string;
}

interface States {
    position: number;
}

export default class Slider extends React.Component<Props, States> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            position: 0,
        };
    }

    public render(): React.ReactElement<{}>  {
        const className = this.props.className;

        const list = this.createBoxes();

        const varStyle = {
            transform: "translateX(-" + 100 / list.length * this.state.position + "%)",
            transition: "transform 0.5s",
            width: list.length * 100 + "%",
        };

        return (
            <div className={(className ? className + " " : "") + styles.wrapper}>
                {this.state.position > 0 ?
                    <button className={styles.back} onClick={this.handleMove.bind(this, -1, list.length - 1)}>
                        <SVG svg={ArrowRightIcon} title=""/>
                    </button>
                : <div className={styles.button_substitute}/>
                }
                <div className={styles.content_wrapper}>
                    <div className={styles.content} style={varStyle}>
                        {list}
                    </div>
                </div>
                {this.state.position < list.length - 1 ?
                    <button onClick={this.handleMove.bind(this, 1, list.length - 1)}>
                        <SVG svg={ArrowRightIcon} title=""/>
                    </button>
                : <div className={styles.button_substitute}/>
                }
            </div>
        );
    }

    private handleMove(step: number, max: number) {

        let position = this.state.position + step;
        if (position < 0) {
            position = 0;
        } else if (position > max) {
            position = max;
        } else {
            this.setState({position});
        }
    }

    private createBoxes(): JSX.Element[] {
        const content = this.props.content;

        const list: JSX.Element[] = [];
        let secondaryList = [];

        let i = 1;
        for (const el of content) {
            secondaryList.push(el);
            if (i === content.length && i % this.props.displayQty !== 0) {
                for (let j = 0; j < this.props.displayQty - (i % this.props.displayQty); j++) {
                    secondaryList.push(<div style={{flex: 1}}></div>);
                }
            }
            if (i % this.props.displayQty === 0 || i === content.length) {
                list.push(
                    <div>{secondaryList}</div>,
                );
                secondaryList = [];
            }

            i++;
        }

        return list;
    }
}
