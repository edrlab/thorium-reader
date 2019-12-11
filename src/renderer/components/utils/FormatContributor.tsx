// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IOpdsContributorView } from "readium-desktop/common/views/opds";
import { dispatchOpdsLink } from "readium-desktop/renderer/opds/handleLink";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import { TranslatorProps, withTranslator } from "./hoc/translator";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    contributors: string[] | IOpdsContributorView[] | undefined;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class FormatContributorWithLink extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render() {

        const { contributors, translator } = this.props;

        const retElement: JSX.Element[] = [];

        if (Array.isArray(contributors)) {

            for (const contributor of contributors) {
                const newContributor = contributor;

                if (typeof newContributor === "object" && newContributor.link?.length) {
                    // FIXME : add pointer hover on 'a' links
                    // tslint:disable-next-line:max-line-length
                    // https://stackoverflow.com/questions/2409836/how-to-set-cursor-style-to-pointer-for-links-without-hrefs
                    retElement.push(
                        <a onClick={
                            () =>
                                this.props.link(newContributor.link[0], this.props.location, newContributor.name)
                        }>
                            {
                                translator.translateContentField(newContributor.name)
                            }
                        </a>,
                    );
                } else if (typeof newContributor === "object") {
                    retElement.push(
                        <>
                            {
                                translator.translateContentField(newContributor.name)
                            }
                        </>,
                    );
                } else {
                    retElement.push(
                        <>
                            {
                                translator.translateContentField(newContributor)
                            }
                        </>,
                    );
                }
            }
        }

        return retElement.reduce(
            (_pv, cv) =>
                <>
                    {
                        cv
                    }
                    {
                        ", "
                    }
                </>,
            <></>,
            );
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => ({
    link: (...data: Parameters<ReturnType<typeof dispatchOpdsLink>>) =>
        dispatchOpdsLink(dispatch)(...data),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(FormatContributorWithLink));
