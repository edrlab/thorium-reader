import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/dragAndDropList.css";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

interface Props {
    list: any[];
    elementContent: (item: any) => any;
    className?: string;
    elementClassName?: string;
    id?: string;
    onChange: (list: any) => void;
}

interface State {
    items: any[];
}

export default class DragAndDropList extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            items: undefined,
        };
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    public componentWillReceiveProps(newProps: Props) {
        if (!this.state.items && newProps.list) {
            this.setState({items: newProps.list});
        }
    }

    public render() {
        const { className, elementClassName, id } = this.props;
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                {(provided: any) => (
                    <ul
                        className={className ? className : ""}
                        id={id}
                        ref={provided.innerRef} >
                        {this.state.items && this.state.items.map((item, index) => (
                            <Draggable key={index} draggableId={index.toString()} index={index}>
                                {(provided2: any) => {
                                    return (
                                    <li
                                        ref={provided2.innerRef}
                                        {...provided2.draggableProps}
                                        {...provided2.dragHandleProps}
                                        className={elementClassName ? elementClassName : ""}
                                    >
                                        {this.props.elementContent(item)}
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
            this.state.items,
            result.source.index,
            result.destination.index,
        );

        this.setState({
            items,
        });

        this.props.onChange(items);
    }

    private reorder(list: any[], startIndex: number, endIndex: number) {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    }
}
