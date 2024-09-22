// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSlider from "readium-desktop/renderer/assets/styles/components/slider.scss";

import classNames from "classnames";
import * as React from "react";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

import { TranslatorProps, withTranslator } from "../../../common/components/hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    content: JSX.Element[];
    className?: string;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    position: number;
    refreshVisible: boolean;
}

class Slider extends React.Component<IProps, IState> {
    private contentRef: React.RefObject<HTMLDivElement>;
    private contentElRefs: HTMLDivElement[] = [];
    private wrapperRef: React.RefObject<HTMLDivElement>;
    // private contentElVisible: boolean[] = [];

    constructor(props: IProps) {
        super(props);

        this.contentRef = React.createRef<HTMLDivElement>();
        this.wrapperRef = React.createRef<HTMLDivElement>();

        this.state = {
            position: 0,
            refreshVisible: true,
        };

        this.update = this.update.bind(this);
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
                /*The this.contentElRefs array is automatically populated in the render() > createContent() function,
                via the div element's ref callback (ref={(ref) => this.contentElRefs[index] = ref}),
                which can be invoked with null during the element's "unmount"
                lifecycle (see https://reactjs.org/docs/refs-and-the-dom.html ).
                Consequently, we need to check for possibly-null values in the this.contentElRefs array,
                in this componentDidUpdate() function. However, we can safely ignore usages of this.contentElRefs
                in the moveInView() and isElementVisible() functions, as these are guaranteed to be invoked when
                the element is still "mounted" (see the onFocus callback).*/
                if (element) {
                    const buttonList = element.getElementsByTagName("button");
                    for (const button of buttonList) {
                        if (!this.isElementVisible(index)) {
                            button.tabIndex = -1;
                        } else {
                            button.tabIndex = 0;
                        }
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
        if (this.contentRef?.current && this.wrapperRef?.current) {
            max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
        }

        const varStyle: React.CSSProperties = {
            left: this.state.position + "px",
            transition: "left 0.5s",
        };

        return (
            <div className={(className ? className + " " : "") + stylesSlider.slider}>
                    <button
                        aria-label={__("accessibility.leftSlideButton")}
                        className={classNames(stylesSlider.slider_button_prev, stylesButtons.button_transparency_icon)}
                        onClick={this.handleMove.bind(this, false)}
                        disabled={this.state.position < 0 ? false : true}
                    >
                    <SVG ariaHidden={true} svg={ArrowRightIcon} />
                </button>
                <div ref={this.wrapperRef} className={stylesSlider.slider_wrapper}
                    /* onScroll={(e) => {this.handleScroll(e)}} */>
                    <div ref={this.contentRef} className={stylesSlider.slider_items} style={varStyle}>
                        {list}
                    </div>
                </div>
                    <button
                        onClick={this.handleMove.bind(this, true)}
                        aria-label={__("accessibility.rightSlideButton")}
                        className={classNames(stylesSlider.slider_button_next, stylesButtons.button_transparency_icon)}
                        disabled={this.state.position > max ? false : true}
                    >
                        <SVG ariaHidden={true} svg={ArrowRightIcon}/>
                    </button>
            </div>
        );
    }

    // private handleScroll(e: React.UIEvent<HTMLDivElement>): void {
    //     if (!this.wrapperRef?.current || !this.contentRef?.current) {
    //         return;
    //     }
    //     const max = - this.wrapperRef.current.scrollWidth + this.wrapperRef.current.offsetWidth;
    //     let step = - e.currentTarget.scrollLeft;
    
    //     if (this.state.position === max) {
    //         step = - step;
    //     }
    
    //     let position =  Math.round((this.state.position + step) / 10) * 10;
    
    //     if (position > 0) {
    //         position = 0;
    //     } else if (position < max) {
    //         position = max;
    //     }
    
    //     this.setState({ position, refreshVisible: true });
    //     console.log(position, step);
    // }

    private handleMove(moveRight: number) {
        if (!this.wrapperRef?.current || !this.contentRef?.current) {
            return;
        }
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

    private moveInView(elementIndex: number) {
        if (!this.wrapperRef?.current || !this.contentRef?.current) {
            return;
        }
        const max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
        const element = this.contentElRefs[elementIndex];

        let elementPosition = -element.offsetLeft;
        const isVisible = this.isElementVisible(elementIndex);
        if (!isVisible) {
            elementPosition = elementPosition > 0 ? 0 : elementPosition < max ? max : elementPosition;
            this.setState({position: elementPosition, refreshVisible: true});
        }
    }

    private createContent(): JSX.Element[] {
        const content = this.props.content;

        // const visible = this.contentElVisible;

        return content.map((element, index) => {
            const props: {[key: string]: string | number} = {};
            // if (!visible[index]) {
            //     props.tabIndex = -1;
            // }
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

    private isElementVisible(elementIndex: number) {
        if (!this.wrapperRef?.current) {
            return false;
        }
        const element = this.contentElRefs[elementIndex];
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
