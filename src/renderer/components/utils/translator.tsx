// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/renderer/di";

import { connect } from "react-redux";

export interface TranslatorProps {
    __?: any;
    translator?: Translator;
}

interface WrapperProps {
    locale: string;
}

export function withTranslator(WrappedComponent: any) {
    const WrapperComponent = class extends React.Component<WrapperProps, undefined> {

        private translator: Translator;
        private translate: any;

        constructor(props: WrapperProps) {
            super(props);

            this.translator = container.get("translator") as Translator;
            this.translate = this.translator.translate.bind(this.translator);
        }

        public componentDidUpdate(oldProps: WrapperProps) {
            if (oldProps.locale !== this.props.locale) {
                this.translator.setLocale(this.props.locale);
                this.forceUpdate();
            }
        }

        public render() {
            const newProps: any = Object.assign(
                {},
                this.props,
                {
                    __: this.translate,
                    translator: this.translator,
                },
            );
            return (<WrappedComponent { ...newProps } />);
        }
    };

    const mapStateToProps = (state: any) => {
        return {
            locale: state.i18n.locale,
        };
    };

    return connect(mapStateToProps)(WrapperComponent);
}
