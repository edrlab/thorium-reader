import * as React from "react";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { configSetDefault } from "readium-desktop/common/redux/actions/reader";
import debounce from "debounce";
import { ReaderConfig } from "readium-desktop/common/models/reader";

export const useSaveConfig = () => {
    const dispatch = useDispatch();
    const saveConfigDebounced = React.useMemo(() => {
        const saveConfig = (config: Partial<ReaderConfig>) => {
            dispatch(configSetDefault.build(config));
        };
        return debounce(saveConfig, 400);
    }, []);

    React.useEffect(() => {
        saveConfigDebounced.clear();
        return () => saveConfigDebounced.flush();
    }, []);

    return saveConfigDebounced;
};
