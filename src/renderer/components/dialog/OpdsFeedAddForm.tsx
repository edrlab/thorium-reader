import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as AddIcon from "readium-desktop/renderer/assets/icons/add.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/app.css";

interface OpdsFeedAddFormProps extends TranslatorProps {
    url?: any;
    addFeed?: any;
    closeDialog?: any;
}

export class OpdsFeedAddForm extends React.Component<OpdsFeedAddFormProps, undefined> {
    private nameRef: any;
    private urlRef: any;

    constructor(props: any) {
        super(props);

        this.nameRef = React.createRef();
        this.urlRef = React.createRef();

        this.add = this.add.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <form onSubmit={ this.add }>
                    <div>
                        <label>Nom</label>
                        <input
                            ref={ this.nameRef }
                            type="text"
                            aria-label="Nom du flux OPDS"
                            placeholder="Nom"
                            size={60}
                        />
                    </div>
                    <div>
                        <label>Nom</label>
                        <input
                            ref={ this.urlRef }
                            type="text"
                            aria-label="Url du flux OPDS"
                            placeholder="Url"
                            size={255}
                            value={ this.props.url }
                        />
                    </div>
                    <button>
                       Ajouter
                    </button>
                </form>
            </div>
        );
    }

    public add(e: any) {
        e.preventDefault();
        const name = this.nameRef.current.value;
        const url = this.urlRef.current.value;
        this.props.addFeed({ name, url});
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: any, ownProps: any) => {
    return {
        closeDialog: (data: any) => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default withApi(
    OpdsFeedAddForm,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "addFeed",
                callProp: "addFeed",
            },
        ],
        mapDispatchToProps,
    },
);
