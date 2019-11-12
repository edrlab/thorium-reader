// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    items: any[];
    elementContent: (item: any, index: number) => any;
    className?: string;
    elementClassName?: string;
    id?: string;
    onChange: (list: any) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export default class DragAndDropList extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.onDragEnd = this.onDragEnd.bind(this);
    }

    public render() {
        const { className, elementClassName, id } = this.props;

        if (!this.props.items) {
            return (<></>);
        }

        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                {(provided: any) => (
                    <ul
                        className={className ? className : ""}
                        id={id}
                        ref={provided.innerRef} >
                        {this.props.items && this.props.items.map((item, index) => (
                            <Draggable key={index} draggableId={index.toString()} index={index}>
                                {(provided2: any) => {
                                    return (
                                    <li
                                        ref={provided2.innerRef}
                                        {...provided2.draggableProps}
                                        {...provided2.dragHandleProps}
                                        className={elementClassName ? elementClassName : ""}
                                    >
                                        {this.props.elementContent(item, index)}
                                    </li>
                                );
                                }}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
                </Droppable>
            </DragDropContext>
        );
    }

    private onDragEnd(result: any) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const items = this.reorder(
            this.props.items,
            result.source.index,
            result.destination.index,
        );

        this.props.onChange(items);
    }

    private reorder(list: any[], startIndex: number, endIndex: number) {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    }
}
