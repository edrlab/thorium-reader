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

import AccessibleMenu from "readium-desktop/renderer/components/utils/menu/AccessibleMenu";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

interface Props extends TranslatorProps {
    open: boolean;
    sections: SectionData[];
    className: string;
    listClassName: string;
    toggleMenu: any;
    focusMenuButton: () => void;
}

interface State {
    openedSection: number;
}

export class SideMenu extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            openedSection: undefined,
        };

        this.handleClickSection = this.handleClickSection.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { open, sections, className, listClassName, toggleMenu } = this.props;
        const { openedSection } = this.state;

        if (!open) {
            return <></>;
        }

        return (<>
            <AccessibleMenu
            dontCloseWhenClickOutside
            focusMenuButton = {this.props.focusMenuButton}
            className={className}
            visible={open}
            toggleMenu={toggleMenu}>
                <ul id={listClassName}>
                    { sections.map((section, index) =>
                        !section.notExtendable ?
                            <SideMenuSection
                                open={ openedSection === index }
                                id={index}
                                key={index}
                                title={section.title}
                                content={section.content}
                                onClick={this.handleClickSection}
                                disabled={section.disabled}
                            />
                        : <li key={index}>
                            { section.content }
                        </li>,
                    )}
                </ul>
            </AccessibleMenu>
            { open &&
                <div aria-hidden={true} className={styles.menu_background} onClick={() => toggleMenu()}/>
            }
        </>);
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

export default withTranslator(SideMenu) as any;
