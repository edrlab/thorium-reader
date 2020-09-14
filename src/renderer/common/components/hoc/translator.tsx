// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";

export interface TranslatorProps {
    __?: I18nTyped;
    translator?: Translator;
}

type TComponentConstructor<P, S> = React.ComponentClass<P, S> | React.StatelessComponent<P>;

// tslint:disable-next-line: max-line-length
export function withTranslator<Props, State = {}>(WrappedComponent: TComponentConstructor<Props & TranslatorProps, State>) {
    const WrapperComponent = class extends React.Component<Props & TranslatorProps, State> {
        public static displayName: string;

        public render() {

            return (
                <TranslatorContext.Consumer>
                    {
                        (translator) => {
                            // const translate = translator.translate.bind(translator) as I18nTyped;

                            // const newProps = Object.assign(
                            //     {},
                            //     this.props,
                            //     {
                            //         __: translate,
                            //         translator,
                            //     },
                            // );

                            const newProps = {
                                ...this.props,
                                __: translator.translate,
                                translator,
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
