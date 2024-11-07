// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";

export interface TranslatorProps {
    __?: I18nFunction;
}

type TComponentConstructor<P> = React.ComponentClass<P> | React.FunctionComponent<P>;

export function withTranslator<Props>(WrappedComponent: TComponentConstructor<React.PropsWithChildren<Props & TranslatorProps>>) {
    const WrapperComponent = class extends React.Component<React.PropsWithChildren<Props & TranslatorProps>, undefined> {
        public static displayName: string;

        constructor(props: React.PropsWithChildren<Props & TranslatorProps>) {
            super(props);
        }

        public render() {

            return (
                <TranslatorContext.Consumer>
                    {
                        (translator) => {

                            const newProps = {
                                ...this.props,
                                __: translator.translate,
                            };

                            return (<WrappedComponent {...newProps} />);
                        }
                    }
                </TranslatorContext.Consumer>
            );
        }
    };

    WrapperComponent.displayName =
        `withTranslator(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
    return WrapperComponent;
}
