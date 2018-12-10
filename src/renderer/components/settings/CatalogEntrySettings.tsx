import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import DragAndDropList from "readium-desktop/renderer/components/utils/DragAndDropList";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header from "./Header";

import * as EditIcon from "readium-desktop/renderer/assets/icons/baseline-edit-24px.svg";

import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

import * as DragableIcon from "readium-desktop/renderer/assets/icons/baseline-drag_handle-24px.svg";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

interface CatalogEntrySettingsProps {
    entries?: CatalogEntryView[];
    updateEntries?: (data: any) => void;
}

interface CatalogEntrySettingStates {
    entryToUpdate: {
        id: number,
        title: string,
    };
}

export class CatalogEntrySettings extends React.Component<CatalogEntrySettingsProps, CatalogEntrySettingStates> {
    private inputRef: any;

    public constructor(props: any) {
        super(props);

        this.state = {
            entryToUpdate: undefined,
        };

        this.inputRef = React.createRef();

        this.handleListOrderChange = this.handleListOrderChange.bind(this);
        this.editEntry = this.editEntry.bind(this);
        this.deleteEntry = this.deleteEntry.bind(this);
        this.closeEdit = this.closeEdit.bind(this);
        this.submitEntryEdit = this.submitEntryEdit.bind(this);
        this.changeEditedEntryTitle = this.changeEditedEntryTitle.bind(this);
        // this.compareEntries = this.compareEntries.bind(this);
    }

    public componentDidUpdate() {
        // if (
        //     this.props.entries &&
        //     !this.compareEntries(this.state.entries, this.props.entries)
        // ) {
        //     this.setState({
        //         entries: this.props.entries,
        //     });
        // }

        if (this.state.entryToUpdate) {
            this.inputRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        return (
            <>
                <LibraryLayout>
                    <Header section={0} />
                    { this.buildDragAndDropList() }
                </LibraryLayout>
            </>
        );
    }

    private buildDragAndDropList() {
        if (this.props.entries && this.props.entries.length === 0) {
            return (
                <p>
                    Aucune sélection existante
                </p>
            );
        }

        return (
            <>
                <div className={styles.section_title}>
                    Disposition sur l'écran d'accueil
                </div>
                <DragAndDropList
                    elementContent={
                        (entry: CatalogEntryView, index: number) =>
                            this.buildDragAndDropListItem(entry, index)
                    }
                    elementClassName={styles.dnd_element}
                    items={this.props.entries}
                    id={styles.draggable_list}
                    onChange={this.handleListOrderChange}
                />
            </>
        );
    }

    private buildDragAndDropListItem(entry: any, index: number) {
        return (
            <>
                <SVG title="ce bloc est déplacable au clic" svg={DragableIcon}/>
                { this.state.entryToUpdate && this.state.entryToUpdate.id === index ? (
                    <form onSubmit={this.submitEntryEdit}>
                        <input
                            value={this.state.entryToUpdate.title}
                            onChange={this.changeEditedEntryTitle}
                            onBlur={this.closeEdit} ref={this.inputRef}
                            type="text"
                        />
                    </form>
                ) : entry.title}
                <span>{entry.totalCount}</span>
                <button onClick={() => this.editEntry(entry, index)}>
                    <SVG svg={EditIcon} />
                </button>
                <button onClick={() => this.deleteEntry(index)}>
                    <SVG svg={DeleteIcon} />
                </button>
            </>
        );
    }

    // Compare 2 list of entries
    // Returns false if there is a difference otherwise true
    // private compareEntries(entryList1: CatalogEntryView[], entryList2: CatalogEntryView[]) {
    //     if (entryList1.length !== entryList2.length) {
    //         return false;
    //     }

    //     for (const index in entryList1) {
    //         const entry1 = entryList1[index];
    //         const entry2 = entryList2[index];

    //         if (entry1.title !== entry2.title) {
    //             return false;
    //         }
    //     }

    //     return true;
    // }

    private handleListOrderChange(entries: CatalogEntryView[]) {
        this.props.updateEntries({
            entries,
        });
        this.closeEdit();
    }

    private editEntry(entry: CatalogEntryView, id: number) {
        this.setState({entryToUpdate: {
            id,
            title: entry.title,
            tag: entry.tag,
        }});
    }

    private deleteEntry(id: number) {
        // Delete an entry
        const updatedEntries: any = [];

        this.props.entries.forEach((entry, index: number) => {
            if (id !== index) {
                updatedEntries.push(entry);
            }
        });

        this.props.updateEntries({
            entries: updatedEntries,
        });
    }

    private closeEdit() {
        this.setState({entryToUpdate: undefined});
    }

    private submitEntryEdit(e: any) {
        e.preventDefault();
        this.closeEdit();

        // Update entries
        const updatedEntries: any = [];

        this.props.entries.forEach((entry, index: number) => {
            let updatedEntry = entry;

            if (this.state.entryToUpdate.id === index) {
                updatedEntry = this.state.entryToUpdate;
            }
            updatedEntries.push(updatedEntry);
        });

        this.props.updateEntries({
            entries: updatedEntries,
        });
    }

    private changeEditedEntryTitle(e: any) {
        const editedEntry = this.state.entryToUpdate;
        editedEntry.title = e.target.value;
        this.setState({
            entryToUpdate: editedEntry,
        });
    }
}

export default withApi(
    CatalogEntrySettings,
    {
        operations: [
            {
                moduleId: "catalog",
                methodId: "getEntries",
                resultProp: "entries",
                onLoad: true,
            },
            {
                moduleId: "catalog",
                methodId: "updateEntries",
                callProp: "updateEntries",
            },
        ],
        refreshTriggers: [
            {
                moduleId: "catalog",
                methodId: "updateEntries",
            },
        ],
    },
);
