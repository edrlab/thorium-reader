import * as React from "react";

import { connect } from "react-redux";

import SVG from "readium-desktop/renderer/components/utils/SVG"

import * as AddIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";
import * as RemoveIcon from "readium-desktop/renderer/assets/icons/baseline-remove-24px.svg";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

interface AddEntryFormProps {
    addEntry?: (name: string) => void;
}

interface AddEntryFormState {
    name: string;
    open: boolean
}

export class AddEntryForm extends React.Component<AddEntryFormProps, AddEntryFormState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            open: false,
            name: "",
        }

        this.submit = this.submit.bind(this);
        this.nameChange = this.nameChange.bind(this);
        this.switchForm = this.switchForm.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <section >
                <button onClick={this.switchForm} className={styles.tag_add_button}>
                    { this.state.open ? 
                        <SVG svg={RemoveIcon} />
                        :
                        <SVG svg={AddIcon} />
                    }
                    <span>Ajouter une sélection</span>
                </button>
                <form onSubmit={this.submit} style={{display: this.state.open ? "inline-block" : "none"}} id={styles.tag_search}>  
                    <input onChange={this.nameChange} type="search" className={styles.tag_inputs} id={styles.tag_inputs} placeholder="Rechercher un tag" title="rechercher un tag"/>
                    <button className={styles.launch}>
                        <SVG svg={SearchIcon} title="lancer la recherche de tag" />
                    </button>
                </form>
            </section>
        );
    }

    private submit(e: any) {
        e.preventDefault();
        this.props.addEntry(this.state.name);
    }

    private nameChange(e: any) {
        this.setState({name: e.target.value});
    }

    private switchForm() {
        this.setState({open: !this.state.open})
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
    };
};

export default connect(undefined, mapDispatchToProps)(AddEntryForm as any);
