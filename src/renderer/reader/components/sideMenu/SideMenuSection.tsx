// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    open?: boolean;
    disabled?: boolean;
    content?: React.ReactElement | React.ReactElement[];
    title: string;
    onClick: (id: number) => void;
    id: number;
    skipMaxHeight: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    style: React.CSSProperties;
}

export class SideMenuSection extends React.Component<IProps, IState> {
    private sectionRef: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);

        this.sectionRef = React.createRef<HTMLDivElement>();

        this.state = {
            style: undefined,
        };
    }

    public componentDidUpdate() {
        if (this.props.open && !this.state.style) {
            this.getSectionStyle();
        }
    }

    public render(): React.ReactElement<{}> {
        const { open, disabled, content, title, onClick, id } = this.props;

        return (
            <>
                <li
                    className={open && !disabled ? stylesReader.active : undefined}
                    key={id}
                >
                    <button onClick={() => onClick(id)} disabled={disabled}
                        aria-pressed={open}>
                        <span>{title}</span>
                        <SVG className={stylesReader.menu_section_svg} svg={ArrowIcon} />
                    </button>

                    <div aria-hidden={open ? undefined : true}
                        style={this.state.style}
                        className={open && !disabled ? stylesReader.tab_content : undefined}>
                        <div ref={this.sectionRef} className={open ? stylesReader.line_tab_content : undefined}>
                            {open && content }
                        </div>
                    </div>
                </li>
            </>
        );
    }

    private getSectionStyle() {
        if (this.props.skipMaxHeight) {
            return;
        }
        if (!this.sectionRef?.current) {
            return;
        }
        const el = this.sectionRef.current;
        let height = 0;
        if (this.props.open && el) {
            height = el.offsetHeight;
        }
        this.setState({style: {maxHeight: height}});
    }
}

export default withTranslator(SideMenuSection);
