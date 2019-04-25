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

export class SideMenuSection extends React.Component<Props> {
    private sectionRef: any = [];

    public constructor(props: Props) {
        super(props);

        this.sectionRef = React.createRef();
    }

    public render(): React.ReactElement<{}> {
        const { open, disabled, content, title, onClick, id } = this.props;

        return (
            <>
                <li
                    className={classnames([open && styles.active])}
                    key={id}
                >
                    <button onClick={() => onClick(id)} disabled={disabled}>
                        <span>{title}</span>
                        <SVG svg={ArrowIcon} />
                    </button>
                </li>
                <div style={this.getSectionStyle()} className={styles.tab_content}>
                    <div ref={this.sectionRef} className={styles.line_tab_content}>
                        {content }
                    </div>
                </div>
            </>
        );
    }

    private getSectionStyle(): any {
        const el = this.sectionRef.current;
        let height = 0;
        if (this.props.open && el) {
            height = el.offsetHeight;
        }
        return {maxHeight: height};
    }
}

export default withTranslator(SideMenuSection) as any;
