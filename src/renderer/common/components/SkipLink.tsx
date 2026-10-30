// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Focusable, TooltipTrigger } from "react-aria-components";
import { connect } from "react-redux";
import { TKeyboardShortcut } from "readium-desktop/common/keyboard";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { ToolTippy } from "./Tooltippy";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    anchorId: string;
    label: string;
    className?: string;
    tooltipkeyboardShortcuts?: TKeyboardShortcut[];
    tooltipkeyboardShortcutsNames?: string[];
    tooltipkeyboardShortcutsDescriptions?: string[];
    onClick?: () => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

class SkipLink extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    //
    public render(): React.ReactElement<{}>  {
        const { onClick, label, className, tooltipkeyboardShortcuts, tooltipkeyboardShortcutsNames, tooltipkeyboardShortcutsDescriptions } = this.props;
        if (tooltipkeyboardShortcuts?.length) {
            return (
                <TooltipTrigger delay={0} closeDelay={0} trigger="hover">
                <Focusable>
                <button
                    onClick={onClick || (() => this.onClick())}
                    className={className}

                    // aria-label={`${label}`}
                    /* aria-label={`${label} [${textualizeKeyboardShortcut(tooltipkeyboardShortcut)}]` + (tooltipkeyboardShortcutName ? ` (${tooltipkeyboardShortcutName})` : "") + (tooltipkeyboardShortcutDescription ? ` <${tooltipkeyboardShortcutDescription}>` : "")} */
                >
                    { label }
                </button>
                </Focusable>
                <ToolTippy
                    placement="bottom"
                    // label={label}
                    tooltipkeyboardShortcuts={tooltipkeyboardShortcuts}
                    tooltipkeyboardShortcutsNames={tooltipkeyboardShortcutsNames}
                    tooltipkeyboardShortcutsDescriptions={tooltipkeyboardShortcutsDescriptions} />
                </TooltipTrigger>
            );
        } else {
            return (
                <button
                    onClick={onClick || (() => this.onClick())}
                    className={className}
                >
                    { label }
                </button>
            );
        }
    }

    private onClick() {
        const element = document.getElementById(this.props.anchorId);
        if (element) {
            element.focus();
        }
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {

    return {
        keyboardShortcuts: state.keyboard.shortcuts,
    };
};

// const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
//     return {
//
//     };
// };

export default connect(mapStateToProps /*, mapDispatchToProps */)(SkipLink);
