import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/dragAndDropList.css";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

interface DragAndDropListProps {
    items: any[];
    elementContent: (item: any, index: number) => any;
    className?: string;
    elementClassName?: string;
    id?: string;
    onChange: (list: any) => void;
}

export default class DragAndDropList extends React.Component<DragAndDropListProps, undefined> {
    public constructor(props: any) {
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
