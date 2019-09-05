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

import { TranslatorProps, withTranslator } from "./hoc/translator";

interface Props extends TranslatorProps {
    content: JSX.Element[];
    className?: string;
}

interface State {
    position: number;
    refreshVisible: boolean;
}

class Slider extends React.Component<Props, State> {
    private contentRef: any;
    private contentElRefs: any[] = [];
    private wrapperRef: any;
    private contentElVisible: boolean[] = [];

    public constructor(props: Props) {
        super(props);

        this.state = {
            position: 0,
            refreshVisible: true,
        };

        this.update = this.update.bind(this);

        this.contentRef = React.createRef();
        this.wrapperRef = React.createRef();
    }

    public componentDidMount() {
        this.setState({refreshVisible: true});
        window.addEventListener("resize", this.update);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.update);
    }

    public componentDidUpdate() {
        if (this.state.refreshVisible) {
            this.contentElRefs.map((element, index) => {
                const buttonList = element.getElementsByTagName("button");
                for (const button of buttonList) {
                    if (!this.isElementVisible(index)) {
                        button.tabIndex = "-1";
                    } else {
                        button.tabIndex = "0";
                    }
                }
            });
            this.setState({refreshVisible: false});
        }
    }

    public render(): React.ReactElement<{}>  {
        const { className, __ } = this.props;

        const list = this.createContent();
        let max = 0;
        if (this.contentRef.current && this.wrapperRef.current) {
            max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
        }

        const varStyle = {
            left: this.state.position + "px",
            transition: "left 0.5s",
        };

        return (
            <div className={(className ? className + " " : "") + styles.wrapper}>
                {this.state.position < 0 ?
                    <button
                        aria-label={__("accessibility.leftSlideButton")}
                        className={styles.back}
                        onClick={this.handleMove.bind(this, false)}
                    >
                        <SVG svg={ArrowRightIcon}/>
                    </button>
                : <div className={styles.button_substitute}/>
                }
                <div ref={this.wrapperRef} className={styles.content_wrapper}>
                    <div ref={this.contentRef} className={styles.content} style={varStyle}>
                        {list}
                    </div>
                </div>
                {this.state.position > max ?
                    <button
                        onClick={this.handleMove.bind(this, true)}
                        aria-label={__("accessibility.rightSlideButton")}
                    >
                        <SVG svg={ArrowRightIcon}/>
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

        this.setState({position, refreshVisible: true});
    }

    private moveInView(elementId: number) {
        const max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
        const element = this.contentElRefs[elementId];

        let elementPosition = -element.offsetLeft;
        const isVisible = this.isElementVisible(elementId);
        if (!isVisible) {
            elementPosition = elementPosition > 0 ? 0 : elementPosition < max ? max : elementPosition;
            this.setState({position: elementPosition, refreshVisible: true});
        }
    }

    private createContent(): JSX.Element[] {
        const content = this.props.content;

        const visible = this.contentElVisible;

        return content.map((element, index) => {
            const props: any = {};
            if (!visible[index]) {
                props.tabIndex = -1;
            }
            return (
                <div
                    ref={(ref) => this.contentElRefs[index] = ref}
                    key={index}
                    onFocus={() => this.moveInView(index)}
                    {...props}
                >
                    {element}
                </div>
            );
        });
    }

    private isElementVisible(elementId: number) {
        const element = this.contentElRefs[elementId];
        const wrapperWidth = this.wrapperRef.current.offsetWidth;
        const position = this.state.position;
        const elementPosition = -element.offsetLeft;
        const elementWidth = element.offsetWidth;

        const isVisible = elementPosition <= position && elementPosition - elementWidth >= position - wrapperWidth;
        return isVisible;
    }

    private update() {
        this.setState({refreshVisible: true});
    }
}

export default withTranslator(Slider);
