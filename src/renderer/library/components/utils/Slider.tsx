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
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { connect } from "react-redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    content: JSX.Element[];
    className?: string;
    resetSliderPosition: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    // position: number;
    // refreshVisible: boolean;
    disableLeft: boolean;
    disableRight: boolean;
}

class Slider extends React.Component<IProps, IState> {
    private contentRef: React.RefObject<HTMLUListElement>;
    private contentElRefs: HTMLLIElement[] = [];
    private wrapperRef: React.RefObject<HTMLDivElement>;
    // private contentElVisible: boolean[] = [];

    constructor(props: IProps) {
        super(props);

        this.contentRef = React.createRef<HTMLUListElement>();
        this.wrapperRef = React.createRef<HTMLDivElement>();

        this.state = {
            // position: 0,
            // refreshVisible: true,
            disableLeft: true,
            disableRight: true,
        };

        // this.update = this.update.bind(this);
    }

    public componentDidMount() {
        // this.setState({refreshVisible: true});
        // window.addEventListener("resize", this.update);
        this.updateButtonState();
        if (this.wrapperRef.current) {
            this.wrapperRef.current.addEventListener("scroll", this.updateButtonState);
        }
    }

    public componentWillUnmount() {
        // window.removeEventListener("resize", this.update);
        if (this.wrapperRef.current) {
            this.wrapperRef.current.removeEventListener("scroll", this.updateButtonState);
        }
    }

    public componentDidUpdate(prevProps: IProps) {
        // if (this.state.refreshVisible) {
        //     this.contentElRefs.map((element, index) => {
        //         /*The this.contentElRefs array is automatically populated in the render() > createContent() function,
        //         via the div element's ref callback (ref={(ref) => this.contentElRefs[index] = ref}),
        //         which can be invoked with null during the element's "unmount"
        //         lifecycle (see https://reactjs.org/docs/refs-and-the-dom.html ).
        //         Consequently, we need to check for possibly-null values in the this.contentElRefs array,
        //         in this componentDidUpdate() function. However, we can safely ignore usages of this.contentElRefs
        //         in the moveInView() and isElementVisible() functions, as these are guaranteed to be invoked when
        //         the element is still "mounted" (see the onFocus callback).*/
        //         if (element) {
        //             const buttonList = element.getElementsByTagName("button");
        //             for (const button of buttonList) {
        //                 if (!this.isElementVisible(index)) {
        //                     button.tabIndex = -1;
        //                 } else {
        //                     button.tabIndex = 0;
        //                 }
        //             }
        //         }
        //     });
        //     this.setState({ refreshVisible: false });
        // }

        if (this.props.resetSliderPosition && prevProps.content && prevProps.content !== this.props.content) {
            // this.setState({ position: 0 });
            this.wrapperRef.current.scrollTo({
                left: 0,
                behavior: "smooth",
            });
        }
    }


    public render(): React.ReactElement<{}>  {
        const { className, __ } = this.props;

        const list = this.createContent();

        return (
            <div className={(className ? className + " " : "") + stylesSlider.slider}>
                    <button
                        aria-label={__("accessibility.leftSlideButton")}
                        className={classNames(stylesSlider.slider_button_prev, stylesButtons.button_transparency_icon)}
                        onClick={() => this.handleMove("left")}
                        disabled={this.state.disableLeft}
                        aria-hidden
                    >
                    <SVG ariaHidden={true} svg={ArrowRightIcon} />
                </button>
                <div ref={this.wrapperRef} className={stylesSlider.slider_wrapper}
                    onWheel={(_event) => {
                        if (this.wrapperRef?.current) {
                            if (this.wrapperRef.current.style.scrollSnapType === "none") {
                                this.wrapperRef.current.style.scrollSnapType = "x mandatory";
                            }
                        }
                    }}
                >
                    <ul ref={this.contentRef} className={stylesSlider.slider_items}>
                        {list}
                    </ul>
                </div>
                    <button
                        onClick={() => this.handleMove("right")}
                        aria-label={__("accessibility.rightSlideButton")}
                        className={classNames(stylesSlider.slider_button_next, stylesButtons.button_transparency_icon)}
                        disabled={this.state.disableRight}
                        aria-hidden
                    >
                        <SVG ariaHidden={true} svg={ArrowRightIcon}/>
                    </button>
            </div>
        );
    }

    private updateButtonState = () => {
        if (!this.wrapperRef.current) return;

        const { scrollLeft, offsetWidth, scrollWidth } = this.wrapperRef.current;

        this.setState({
            disableLeft: scrollLeft <= 0,
            disableRight: scrollLeft + offsetWidth >= scrollWidth,
        });
    };

    private handleMove(direction: "left" | "right") {
        if (!this.wrapperRef?.current || !this.contentRef?.current) return;

        if (this.wrapperRef?.current) {
            if (this.wrapperRef.current.style.scrollSnapType === "none") {
                this.wrapperRef.current.style.scrollSnapType = "x mandatory";
            }
        }

        const container = this.wrapperRef.current;
        const scrollAmount = container.offsetWidth * 0.5;

        const newScrollLeft =
            direction === "left"
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({
            left: newScrollLeft,
            behavior: "smooth",
        });
        // this.setState({ /* position: newScrollLeft, */ refreshVisible: true });
    }

    // private moveInView(elementIndex: number) {
    //     if (!this.wrapperRef?.current || !this.contentRef?.current) {
    //         return;
    //     }
    //     const max = -this.contentRef.current.offsetWidth + this.wrapperRef.current.offsetWidth;
    //     const element = this.contentElRefs[elementIndex];

    //     let elementPosition = -element.offsetLeft;
    //     const isVisible = this.isElementVisible(elementIndex);
    //     if (!isVisible) {
    //         elementPosition = elementPosition > 0 ? 0 : elementPosition < max ? max : elementPosition;
    //         this.setState({position: elementPosition, refreshVisible: true});
    //     }
    // }

    private createContent(): JSX.Element[] {
        const content = this.props.content;

        // const visible = this.contentElVisible;

        return content.map((element, index) => {
            const props: {[key: string]: string | number} = {};
            // if (!visible[index]) {
            //     props.tabIndex = -1;
            // }
            return (
                <li
                    ref={(ref) => this.contentElRefs[index] = ref}
                    key={index}
                    /* onFocus={() => this.moveInView(index)} */
                    onFocus={(ev) => {
                        // console.log("ONFOCUS", ev.target?.tagName, ev.target?.tabIndex);
                        if (this.wrapperRef?.current) {
                            this.wrapperRef.current.style.scrollSnapType = "none";
                        }
                        // this.contentElRefs?.forEach((el) => {
                        //    el.style.scrollSnapAlign = ev.currentTarget === el ? "start end" : "none";
                        // });
                        if (ev.target?.tagName?.toUpperCase() === "A")
                        setTimeout(() => {
                            // ev.target?.tagName?.toUpperCase() === "A" && ((ev.target as any)?.scrollIntoViewIfNeeded ? (ev.target as any)?.scrollIntoViewIfNeeded(false) :
                            ev.target?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                                inline: "nearest",
                            });
                        }, 100);
                    }}
                    {...props}
                >
                    {element}
                </li>
            );
        });
    }

    // private isElementVisible(elementIndex: number) {
    //     if (!this.wrapperRef?.current) {
    //         return false;
    //     }
    //     const element = this.contentElRefs[elementIndex];
    //     const wrapperWidth = this.wrapperRef.current.offsetWidth;
    //     const position = this.wrapperRef.current.scrollLeft;  // this.state.position;
    //     const elementPosition = -element.offsetLeft;
    //     const elementWidth = element.offsetWidth;

    //     const isVisible = elementPosition <= position && elementPosition - elementWidth >= position - wrapperWidth;
    //     return isVisible;
    // }

    // private update() {
    //     this.setState({refreshVisible: true});
    // }
}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps)(withTranslator(Slider));
