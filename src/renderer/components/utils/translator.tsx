import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";

import { container } from "readium-desktop/renderer/di";

export interface TranslatorProps {
    __: any;
    translator: any;
}

export function withTranslator(WrappedComponent: any) {
    const WrapperComponent = class extends React.Component<undefined, undefined> {
        render() {
            const translator = container.get("translator") as Translator;
            const translate = translator.translate.bind(translator);

            const newProps: any = Object.assign(
                {},
                this.props,
                {
                    "__": translate,
                    translator,
                },
            );
            return (<WrappedComponent { ...newProps } />);
        }
    };

    return WrapperComponent;
}
