// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import { SectionData } from "./sideMenuData";
import SideMenuSection from "./SideMenuSection";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
interface Props extends TranslatorProps {
    open: boolean;
    sections: SectionData[];
    className: string;
    listClassName: string;
}

interface State {
    openedSection: number;
}

export class ReaderMenu extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            openedSection: undefined,
        };

        this.handleClickSection = this.handleClickSection.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, open, sections, className, listClassName } = this.props;
        const { openedSection } = this.state;

        return (
            <div style={{visibility: open ? "visible" : "hidden"}} className={className}>
                <ul id={listClassName}>
                    { sections.map((section, index) =>
                        <SideMenuSection
                            open={ openedSection === index }
                            id={index}
                            title={section.title}
                            content={section.content}
                            onClick={this.handleClickSection}
                            disabled={section.disabled}
                        />,
                    )}
                </ul>
            </div>
        );
    }

    private handleClickSection(id: number) {
        if (!this.props.sections[id].disabled) {
            let { openedSection } = this.state;
            if (openedSection === id) {
                openedSection = undefined;
            } else {
                openedSection = id;
            }

            this.setState({ openedSection });
        }
    }
}

export default withTranslator(ReaderMenu) as any;
