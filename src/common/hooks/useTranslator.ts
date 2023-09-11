import * as React from "react";
import { TranslatorContext } from "readium-desktop/renderer/common/translator.context";

export function useTranslator() {

    const translator = React.useContext(TranslatorContext);
    const { translate: _ } = translator;

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => {
        const handleLocaleChange = () => {
            forceUpdate();
        }
        return translator.subscribe(handleLocaleChange);
    }, [translator.subscribe]);

    return _;
}