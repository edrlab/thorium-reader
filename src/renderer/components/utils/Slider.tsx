// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/slider.css";

import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

interface Props {
    content: JSX.Element[];
    className?: string;
}

interface States {
    position: number;
}

export default class Slider extends React.Component<Props, States> {
    private contentRef: any;
    private wrapperRef: any;

    public constructor(props: Props) {
        super(props);

        this.state = {
            position: 0,
        };

        this.contentRef = React.createRef();
        this.wrapperRef = React.createRef();

        window.addEventListener("resize", () => this.forceUpdate());
    }

    public componentDidMount() {
        this.forceUpdate();
    }

    public render(): React.ReactElement<{}>  {
        const className = this.props.className;

        const list = this.createBoxes();
        let max = 0;
        if (this.contentRef.current && this.wrapperRef.current) {
            max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
        }

        const varStyle = {
            transform: "translateX(" + this.state.position + "px)",
            transition: "transform 0.5s",
        };

        return (
            <div className={(className ? className + " " : "") + styles.wrapper}>
                {this.state.position < 0 ?
                    <button className={styles.back} onClick={this.handleMove.bind(this, false)}>
                        <SVG svg={ArrowRightIcon} title=""/>
                    </button>
                : <div className={styles.button_substitute}/>
                }
                <div ref={this.wrapperRef} className={styles.content_wrapper}>
                    <div ref={this.contentRef} className={styles.content} style={varStyle}>
                        {list}
                    </div>
                </div>
                {this.state.position > max ?
                    <button onClick={this.handleMove.bind(this, true)}>
                        <SVG svg={ArrowRightIcon} title=""/>
                    </button>
                : <div className={styles.button_substitute}/>
                }
            </div>
        );
    }

    private handleMove(moveRight: number) {
        let  step = this.wrapperRef.current.offsetWidth / 2;
        if (moveRight) {
            step = -step;
        }
        const max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
        let position = this.state.position + step;
        if (position > 0) {
            position = 0;
        } else if (position < max) {
            position = max;
        }

        this.setState({position});
    }

    private createBoxes(): JSX.Element[] {
        const content = this.props.content;

        return content.map((el) => el);
    }
}
