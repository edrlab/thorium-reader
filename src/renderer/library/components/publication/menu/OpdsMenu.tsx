// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { PublicationInfoOpdsWithRadix, PublicationInfoOpdsWithRadixContent, PublicationInfoOpdsWithRadixTrigger } from "../../dialog/publicationInfos/PublicationInfo";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    opdsPublicationView: IOpdsPublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export class OpdsMenu extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

    }

    public render(): React.ReactElement<{}> {

        const {
            __,
        } = this.props;

        return (
            <>
                <PublicationInfoOpdsWithRadix
                    opdsPublicationView={this.props.opdsPublicationView}
                >
                    <PublicationInfoOpdsWithRadixTrigger asChild>
                        <button>
                            {__("opds.menu.aboutBook")}
                        </button>

                    </PublicationInfoOpdsWithRadixTrigger>
                    <PublicationInfoOpdsWithRadixContent />
                </PublicationInfoOpdsWithRadix>
            </>
        );
    }
}

export default withTranslator(OpdsMenu);
