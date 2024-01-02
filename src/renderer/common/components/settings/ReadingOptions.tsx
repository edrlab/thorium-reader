import * as React from "react";
// import { DialogCloseButton } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as Tabs from "@radix-ui/react-tabs";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volup-icon.svg";
// import * as ClockWiseIcon from "readium-desktop/renderer/assets/icons/clockwise-icon.svg";
import { FontFamily, FontSize } from "./Reading/ReadingText";
import ReadingTheme from "./Reading/ReadingTheme";
import ReadingDisplayLayout from "./Reading/ReadingDisplayLayout";
import ReadingDisplayAlign from "./Reading/ReadingDisplayAlign";
import ReadingDisplayCol from "./Reading/ReadingDisplayCol";
import ReadingDisplayMathJax from "./Reading/ReadingDisplayMathJax";
import ReadingSpacing from "./Reading/ReadingSpacing";
import ReadingAudio from "./Reading/ReadingAudio";
import { DialogCloseButton, DialogWithRadix, DialogWithRadixContentSettings, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";

// const TabTitle = (props: any) => {
//     return (
//         <div className={stylesSettings.settings_tab_title}>
//             <h2>{props.title}</h2>
//             <DialogCloseButton />
//         </div>
//     )
// }

const TabTitle = (props: any) => {
    return (
        <div className={stylesSettings.settings_tab_title}>
            <h2>{props.title}</h2>
        </div>
    );
};

export const ReaderSettingsDialog = () => {
    return (
    <DialogWithRadix>
        <DialogWithRadixTrigger asChild>
            <button
                className={stylesButtons.button_transparency_icon}
            >
                <SVG ariaHidden={true} svg={SettingsIcon} />
            </button>
        </DialogWithRadixTrigger>
        <DialogWithRadixContentSettings>
            <ReadingOptions />
        </DialogWithRadixContentSettings>
    </DialogWithRadix>
    );
};


const ReadingOptions = () => {
    const [__] = useTranslator();
    const [allowCustom, setAllowCustom] = React.useState(false);


    return (
            <Tabs.Root defaultValue={allowCustom ? "tab13" : "tab11"} data-orientation="vertical" className={stylesSettings.settings_container}>
                <Tabs.List className={stylesSettings.settings_tabslist} aria-orientation="vertical">
                <Tabs.Trigger value="tab13" disabled={allowCustom ? false : true}>
                        <SVG ariaHidden svg={TextAreaIcon} />
                        <h3>{__("reader.settings.text")}</h3>
                                                {!allowCustom ?
                        <i>{__("reader.settings.disabled")}</i>
                        :
                        null
                        }
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab14" disabled={allowCustom ? false : true}>
                        <SVG ariaHidden svg={AlignLeftIcon} />
                        <h3>{__("reader.settings.spacing")}</h3>
                        {!allowCustom ?
                        <i>{__("reader.settings.disabled")}</i>
                        :
                        null
                        }
                    </Tabs.Trigger>
                <Tabs.Trigger value="tab11">
                        <SVG ariaHidden svg={LayoutIcon} />
                        <h3>{__("reader.settings.display")}</h3>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab12">
                        <SVG ariaHidden svg={VolumeUpIcon} />
                        <h3>{__("reader.media-overlays.title")}</h3>
                    </Tabs.Trigger>
                    {/* <Tabs.Trigger value="tab15">
                        <SVG ariaHidden svg={ClockWiseIcon} />
                        <p>{__("reader.settings.save.title")}</p>
                    </Tabs.Trigger> */}
                    <div className={stylesSettings.toggleCustom}>
                        <label>
                            <input id="id-switch-1" type="checkbox" role="switch" checked={allowCustom} onChange={() => setAllowCustom(!allowCustom)} />
                            <span className="state">
                            <span className="container">
                                <span className="position"> </span>
                            </span>
                            {/* <span className="label">{__("reader.settings.customizeReader")}</span> */}
                            </span>
                        </label>
                        <p>{__("reader.settings.customizeReader")}</p>
                    </div>
                </Tabs.List>
                <div className={stylesSettings.settings_content}>
                    {allowCustom ? 
                    <>
                    <Tabs.Content value="tab13" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.text")} />
                        <section className={stylesSettings.settings_tab}>
                            <ReadingTheme />
                            <FontSize />
                            <FontFamily />
                        </section>
                    </Tabs.Content>
                    <Tabs.Content value="tab14" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.spacing")} />
                        <section className={stylesSettings.settings_tab}>
                            <ReadingSpacing />
                        </section>
                    </Tabs.Content>
                    </>
                    : null
                    }
                    <Tabs.Content value="tab11" tabIndex={-1}>
                        <TabTitle title={__("reader.settings.display")} />
                        <section className={stylesSettings.settings_tab}>
                            <ReadingDisplayLayout />
                            <ReadingDisplayAlign />
                            <ReadingDisplayCol />
                            <ReadingDisplayMathJax />
                        </section>
                    </Tabs.Content>
                    <Tabs.Content value="tab12" tabIndex={-1}>
                        <TabTitle title={__("reader.media-overlays.title")}/>
                        <section className={stylesSettings.settings_tab}>
                            <ReadingAudio />
                        </section>
                    </Tabs.Content>
                </div>
                <div className={stylesSettings.close_button_div}>
                    <DialogCloseButton />
                </div>
            </Tabs.Root>
    );
};
