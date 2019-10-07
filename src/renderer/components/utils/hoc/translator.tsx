// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { diRendererGet } from "readium-desktop/renderer/di";

export interface TranslatorProps {
    __?: I18nTyped;
    translator?: Translator;
}

type TComponentConstructor<P> = React.ComponentClass<P> | React.StatelessComponent<P>;

export function withTranslator<Props>(WrappedComponent: TComponentConstructor<Props & TranslatorProps>) {
    const WrapperComponent = class extends React.Component<Props & TranslatorProps> {
        public static displayName: string;
        public render() {
            const translator = diRendererGet("translator");
            const translate = translator.translate.bind(translator) as I18nTyped;

            const newProps: any = Object.assign(
                {},
                this.props,
                {
                    __: translate,
                    translator,
                },
            );
            return (<WrappedComponent { ...newProps } />);
        }
    };

    WrapperComponent.displayName =
        `withTranslator(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
    return WrapperComponent;
}
