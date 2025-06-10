// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { AnnotationEdit } from "./AnnotationEdit";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { TDrawType } from "readium-desktop/common/redux/states/renderer/note";
import { TDispatch } from "readium-desktop/typings/redux";
import { readerLocalActionAnnotations } from "../redux/actions";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    isOpen: boolean;
    position: { x: number; y: number } | null;
}

class TextSelectionPopup extends React.Component<IProps, IState> {
    private previousSelectionText: string | null = null;

    constructor(props: IProps) {
        super(props);
        this.state = {
            isOpen: false,
            position: null,
        };
    }    public componentDidUpdate(prevProps: IProps) {
        // Check if there's a new text selection
        const currentSelection = this.props.selectionInfo;
        const hadSelection = prevProps.selectionInfo?.cleanText;
        const hasSelection = currentSelection?.cleanText;
        const selectionIsNew = this.props.selectionIsNew;

        console.log('TextSelectionPopup componentDidUpdate:', {
            hasSelection: !!hasSelection,
            hadSelection: !!hadSelection,
            selectionIsNew,
            currentText: hasSelection?.slice(0, 50),
            previousText: this.previousSelectionText?.slice(0, 50),
        });

        // If we have a new selection that's different from the previous one
        if (hasSelection && hasSelection !== this.previousSelectionText && selectionIsNew) {
            console.log('Showing popup for new selection:', hasSelection.slice(0, 50));
            this.previousSelectionText = hasSelection;
            this.showPopup();
        } else if (!hasSelection && hadSelection) {
            // Selection was cleared
            console.log('Hiding popup - selection cleared');
            this.previousSelectionText = null;
            this.hidePopup();
        }
    }    private showPopup = () => {
        console.log('showPopup called');
        
        // Try to get position from current DOM selection first
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
                // Position popup near the selection
                const position = {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10, // Position above the selection
                };

                console.log('Setting popup position from DOM selection:', position);
                this.setState({
                    isOpen: true,
                    position,
                });
                return;
            }
        }

        // Fallback: position popup at center of screen if no DOM selection
        const position = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 3,
        };

        console.log('Setting popup position at screen center (fallback):', position);
        this.setState({
            isOpen: true,
            position,
        });
    };

    private hidePopup = () => {
        this.setState({
            isOpen: false,
            position: null,
        });
    };    private handleSave = (color: IColor, comment: string, drawType: TDrawType, tags: string[]) => {
        this.props.saveAnnotation(false, color, comment, drawType, tags);
        this.hidePopup();
    };

    private handleCancel = () => {
        this.hidePopup();
    };

    public render(): React.ReactElement<{}> {
        const { isOpen, position } = this.state;
        const { selectionInfo, locatorExtended, readerConfig } = this.props;

        if (!isOpen || !position || !selectionInfo || !locatorExtended) {
            return null;
        }

        return (
            <Popover.Root open={isOpen} onOpenChange={(open) => !open && this.hidePopup()}>
                <Popover.Anchor
                    style={{
                        position: "fixed",
                        left: position.x,
                        top: position.y,
                        width: 1,
                        height: 1,
                        pointerEvents: "none",
                    }}
                />
                <Popover.Portal>
                    <Popover.Content
                        side="top"
                        align="center"
                        sideOffset={5}
                        style={{ zIndex: 1000 }}
                        onPointerDownOutside={this.handleCancel}
                    >
                        <AnnotationEdit
                            save={this.handleSave}
                            cancel={this.handleCancel}
                            dockedMode={false}
                            uuid=""
                            color={readerConfig.annotation_defaultColor}
                            drawType={readerConfig.annotation_defaultDrawType}
                            tags={[]}
                            comment=""
                            locatorExtended={locatorExtended}
                        />
                        <Popover.Arrow 
                            style={{ fill: "var(--color-extralight-grey)" }} 
                            width={15} 
                            height={10} 
                        />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        );
    }
}

const mapStateToProps = (state: IReaderRootState) => {
    return {
        selectionInfo: state.reader.locator?.selectionInfo,
        selectionIsNew: state.reader.locator?.selectionIsNew,
        locatorExtended: state.reader.locator,
        readerConfig: state.reader.config,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        saveAnnotation: (_fromKeyboard: boolean, color: IColor, comment: string, drawType: TDrawType, tags: string[]) => {
            dispatch(readerLocalActionAnnotations.createNote.build(color, comment, drawType, tags));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(TextSelectionPopup);
