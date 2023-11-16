import classNames from "classnames";
import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

const SaveConfig = (props: any) => {

    const { readerConfig } = props;
    const [__] = useTranslator();

    return (

        <div className={classNames(stylesReader.line_tab_content, stylesReader.config_save)}>

            <button
                onClick={() => props.setDefaultConfig(readerConfig)}
                aria-hidden={false}
                // className={className}
            >
                {
                    __("reader.settings.save.apply")
                }
            </button>
            <button
                onClick={() => props.setDefaultConfig()}
                aria-hidden={false}
                // className={className}
            >
                {
                    __("reader.settings.save.reset")
                }
            </button>
        </div>
    );
}

export default SaveConfig;