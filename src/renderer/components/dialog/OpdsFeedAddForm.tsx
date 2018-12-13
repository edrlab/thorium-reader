// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

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
                <h2>Ajout d'un flux OPDS</h2>
                <form onSubmit={ this.add }>
                    <div>
                        <label>Nom : </label>
                        <input
                            ref={ this.nameRef }
                            type="text"
                            aria-label="Nom du flux OPDS"
                            placeholder="Nom"
                            size={60}
                        />
                    </div>
                    <div>
                        <label>Lien : </label>
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
        const title = this.nameRef.current.value;
        const url = this.urlRef.current.value;
        this.props.addFeed({ title, url});
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
