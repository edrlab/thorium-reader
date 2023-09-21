import * as React from "react";
import { Translator } from "readium-desktop/common/services/translator";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";

export function useTranslator(): [typeof Translator.prototype.translate, Translator] {

    const translator = React.useContext(TranslatorContext);
    const { translate: __ } = translator;

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => {
        const handleLocaleChange = () => {
            forceUpdate();
        };
        return translator.subscribe(handleLocaleChange);
    }, [translator.subscribe]);

    return [__, translator];
}
