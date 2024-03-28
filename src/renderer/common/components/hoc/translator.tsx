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

type TComponentConstructor<P> = React.ComponentClass<P> | React.FunctionComponent<P>;

export function withTranslator<Props>(WrappedComponent: TComponentConstructor<React.PropsWithChildren<Props & TranslatorProps>>) {
    const WrapperComponent = class extends React.Component<React.PropsWithChildren<Props & TranslatorProps>, undefined> {
        public static displayName: string;
        unsubscribe_: () => void | undefined;

        // from useTranslator.ts
        // const [, forceUpdate] = React.useReducer(x => x + 1, 0);
        // React.useEffect(() => {
        //     const handleLocaleChange = () => {
        //         forceUpdate();
        //     };
        //     return translator.subscribe(handleLocaleChange);
        // }, [translator.subscribe]);

        constructor(props: React.PropsWithChildren<Props & TranslatorProps>) {
            super(props);

            this.unsubscribe_ = undefined;
        }

        componentWillUnmount(): void {
            if (this.unsubscribe_) {
                this.unsubscribe_();
                this.unsubscribe_ = undefined;
            }
        }

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

                            if (!this.unsubscribe_) {
                                this.unsubscribe_ = translator.subscribe(() => { this.forceUpdate(); });
                            }

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
