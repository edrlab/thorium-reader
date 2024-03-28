// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import AccessibleMenu from "readium-desktop/renderer/common/components/menu/AccessibleMenu";

import { SectionData } from "./sideMenuData";
import SideMenuSection, { SideMenuSection as SideMenuSectionClass } from "./SideMenuSection";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    open: boolean;
    sections: SectionData[];
    className: string;
    listClassName: string;
    toggleMenu: () => void;
    doBackFocusMenuButton: () => void;

    openedSection: number | undefined;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    openedSection: number;
}

export class SideMenu extends React.Component<IProps, IState> {
    private currentOpenRef: React.RefObject<SideMenuSectionClass>;

    constructor(props: IProps) {
        super(props);
        this.currentOpenRef = React.createRef<SideMenuSectionClass>();

        this.state = {
            openedSection: (typeof props.openedSection === "number" && props.openedSection >= 0) ?
                props.openedSection : undefined,
        };

        this.handleClickSection = this.handleClickSection.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (this.props.openedSection !== oldProps.openedSection) {
            this.setState({ openedSection: this.props.openedSection });
            if (this.props.open !== oldProps.open) {
                setTimeout(() => {
                    if (this.currentOpenRef?.current) {
                        const el = ReactDOM.findDOMNode(this.currentOpenRef.current) as HTMLElement;
                        if (el) {
                            if (el.scrollIntoView) {
                                el.scrollIntoView();
                            }
                            const inputEl = el.querySelector("input") || el.querySelector("button");
                            if (inputEl && inputEl.focus) {
                                inputEl.focus();
                            }
                        }
                    }
                }, 300);
            }
        }
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
                doBackFocusMenuButton = {this.props.doBackFocusMenuButton}
                className={className}
                visible={open}
                toggleMenu={toggleMenu}
            >
                <ul id={listClassName}>
                    { sections.map((section, index) =>
                        !section.notExtendable ?
                            <SideMenuSection
                                ref={ openedSection === index ?
                                    (this.currentOpenRef as any) :
                                    undefined}
                                open={ openedSection === index }
                                id={index}
                                key={index}
                                title={section.title}
                                content={section.content}
                                onClick={this.handleClickSection}
                                disabled={section.disabled}
                                skipMaxHeight={section.skipMaxHeight}
                            />
                        : <li
                            ref={ openedSection === index ?
                                (this.currentOpenRef as any) :
                                undefined}
                            key={index}>
                            { section.content }
                        </li>,
                    )}
                </ul>
            </AccessibleMenu>
            { open &&
                <div aria-hidden={true} className={stylesReader.menu_background} onClick={() => toggleMenu()}/>
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

export default withTranslator(SideMenu);
