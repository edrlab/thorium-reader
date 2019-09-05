// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import classnames from "classnames";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

interface Props extends TranslatorProps {
    open?: boolean;
    disabled?: boolean;
    content?: any;
    title: string;
    onClick: (id: number) => void;
    id: number;
}

interface State {
    style: any;
}

export class SideMenuSection extends React.Component<Props, State> {
    private sectionRef: any = [];

    public constructor(props: Props) {
        super(props);
        this.state = {
            style: undefined,
        };
        this.sectionRef = React.createRef();
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
                    className={open ? classnames([styles.active]) : undefined}
                    key={id}
                >
                    <button onClick={() => onClick(id)} disabled={disabled}>
                        <span>{title}</span>
                        <SVG className={styles.menu_section_svg} svg={ArrowIcon} />
                    </button>

                    <div aria-hidden={open ? undefined : true}
                        style={this.state.style}
                        className={open ? classnames([styles.tab_content, styles.div_listitem]) : undefined}>
                        <div ref={this.sectionRef} className={open ? styles.line_tab_content : undefined}>
                            {open && content }
                        </div>
                    </div>
                </li>
            </>
        );
    }

    private getSectionStyle(): any {
        const el = this.sectionRef.current;
        let height = 0;
        if (this.props.open && el) {
            height = el.offsetHeight;
        }
        this.setState({style: {maxHeight: height}});
    }
}

export default withTranslator(SideMenuSection) as any;
