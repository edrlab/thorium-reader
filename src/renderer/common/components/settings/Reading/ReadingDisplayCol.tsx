import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as TwoColsIcon from "readium-desktop/renderer/assets/icons/2cols-icon.svg";
import * as AlignJustifyIcon from "readium-desktop/renderer/assets/icons/align-justify-icon.svg";
import { useSaveConfig } from "./useSaveConfig";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { SettingsRadioBtnTemplate, TOptions } from "./SettingsRadioBtnTemplate";


const ReadingDisplayCol = () => {
    const [__] = useTranslator();
    const saveConfigDebounced = useSaveConfig();
    const colCount = useSelector((s: ICommonRootState) => s.reader.defaultConfig.colCount);
    const paged = useSelector((s: ICommonRootState) => s.reader.defaultConfig.paged);
    const scrollable = !paged;

    const [state, setState] = React.useState(scrollable ? "auto" : colCount);
    React.useEffect(() => {
        scrollable ? setState("auto") : setState(colCount);
    }, [scrollable, colCount]);

    const options: TOptions = [
        {
            id: "col_auto",
            onChange: () => saveConfigDebounced({ colCount: "auto" }),
            svg: AlignJustifyIcon,
            description: `${__("reader.settings.column.auto")}`,
            checked: (state === "auto"),
            disabled: false,
            name: "column",
        },
        {
            id: "col_one",
            onChange: () => saveConfigDebounced({ colCount: "1" }),
            svg: AlignJustifyIcon,
            description: `${__("reader.settings.column.one")}`,
            checked: (state === "1"),
            disabled: (scrollable),
            name: "column",
        },
        {
            id: "col_two",
            onChange: () => saveConfigDebounced({ colCount: "2" }),
            svg: TwoColsIcon,
            description: `${__("reader.settings.column.two")}`,
            checked: (state === "2"),
            disabled: (scrollable),
            name: "column",
        },
    ];

    const List = () => {
        return options.map((o) => <SettingsRadioBtnTemplate key={o.id} {...o} />);
    };

    return (
        <section className={stylesSettings.section}>
            <div>
                <h4>{__("reader.settings.column.title")}</h4>
            </div>
            <div className={stylesSettings.display_options}>
                <List />
            </div>
        </section>
    );
};
export default ReadingDisplayCol;
