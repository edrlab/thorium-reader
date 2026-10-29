// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { Focusable, OverlayArrow, Tooltip, TooltipTrigger } from "react-aria-components";
import { connect } from "react-redux";
import { TKeyboardShortcut } from "readium-desktop/common/keyboard";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { PrettifyKeyboardShortcut } from "readium-desktop/renderer/common/components/Keyboard";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    anchorId: string;
    label: string;
    className?: string;
    tooltipkeyboardShortcut?: TKeyboardShortcut;
    tooltipkeyboardShortcutName?: string;
    tooltipkeyboardShortcutDescription?: string;
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
        const { onClick, label, className, tooltipkeyboardShortcut, tooltipkeyboardShortcutName, tooltipkeyboardShortcutDescription } = this.props;
        if (tooltipkeyboardShortcut) {
            return (
                <TooltipTrigger delay={0} closeDelay={0} trigger="hover">
                <Focusable>
                <button
                    onClick={onClick || (() => this.onClick())}
                    aria-hidden={false}
                    className={className}

                    aria-label={`${label}`}
                    /* aria-label={`${label} [${textualizeKeyboardShortcut(tooltipkeyboardShortcut)}]` + (tooltipkeyboardShortcutName ? ` (${tooltipkeyboardShortcutName})` : "") + (tooltipkeyboardShortcutDescription ? ` <${tooltipkeyboardShortcutDescription}>` : "")} */
                >
                    { label }
                </button>
                </Focusable>
                <Tooltip placement="bottom" offset={0} className={classNames("tooltipKeyboardShortcut")}>
                <OverlayArrow><svg width={10} height={10} viewBox="0 0 8 8"><path d="M0 0 L4 4 L8 0" /></svg></OverlayArrow>
                <p><PrettifyKeyboardShortcut hideFromScreenReaders={false} def={tooltipkeyboardShortcut} /></p>
                {
                    (tooltipkeyboardShortcutName ? (<p>{tooltipkeyboardShortcutName}</p>) : (<></>))
                }{
                    (tooltipkeyboardShortcutDescription ? (<p>{tooltipkeyboardShortcutDescription}</p>) : (<></>))
                }
                </Tooltip>
                </TooltipTrigger>
            );
        } else {
            return (
                <button
                    onClick={onClick || (() => this.onClick())}
                    aria-hidden={false}
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
