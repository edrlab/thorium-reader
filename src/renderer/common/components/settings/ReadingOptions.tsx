import * as React from "react";
// import { DialogCloseButton } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as Tabs from "@radix-ui/react-tabs";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SettingsIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg"
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volup-icon.svg";
import * as ClockIcon from "readium-desktop/renderer/assets/icons/clockwise-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/plusBorder-icon.svg";
// import * as ClockWiseIcon from "readium-desktop/renderer/assets/icons/clockwise-icon.svg";
import { FontFamily, FontSize } from "./Reading/ReadingText";
import ReadingTheme from "./Reading/ReadingTheme";
import ReadingDisplayLayout from "./Reading/ReadingDisplayLayout";
import ReadingDisplayAlign from "./Reading/ReadingDisplayAlign";
import ReadingDisplayCol from "./Reading/ReadingDisplayCol";
import ReadingDisplayMathJax from "./Reading/ReadingDisplayMathJax";
import ReadingSpacing from "./Reading/ReadingSpacing";
import ReadingAudio from "./Reading/ReadingAudio";
import { DialogCloseButton, DialogFooter, DialogHeader, DialogWithRadix, DialogWithRadixContentSettings, DialogWithRadixTrigger } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import { DialogTitle } from "@radix-ui/react-dialog";

// const TabTitle = (props: any) => {
//     return (
//         <div className={stylesSettings.settings_tab_title}>
//             <h2>{props.title}</h2>
//             <DialogCloseButton />
//         </div>
//     )
// }

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
            <DialogHeader>
                <DialogTitle>
                    Reading Preferences
                </DialogTitle>
                <DialogCloseButton />
            </DialogHeader>
            <ReadingOptions />
            <DialogFooter>
                <button className={stylesButtons.button_secondary_blue}>
                    <SVG ariaHidden svg={ClockIcon} />
                    Reverse to original 
                </button>
                <button className={stylesButtons.button_primary_blue}>
                    <SVG ariaHidden svg={PlusIcon} />
                    More options
                </button>
            </DialogFooter>
        </DialogWithRadixContentSettings>
    </DialogWithRadix>
    )
}

const ReadingOptions = () => {
    const [__] = useTranslator();
    return (
        <section className={stylesSettings.settings_tab_container_reading}>
            <Tabs.Root defaultValue="tab11" data-orientation="horizontal">
                <Tabs.List className={stylesSettings.tablist_reading} aria-orientation="horizontal">
                    <Tabs.Trigger value="tab11">
                        <SVG ariaHidden svg={TextAreaIcon} />
                        <h3>{__("reader.settings.text")}</h3>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab12">
                        <SVG ariaHidden svg={LayoutIcon} />
                        <h3>{__("reader.settings.display")}</h3>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab13">
                        <SVG ariaHidden svg={AlignLeftIcon} />
                        <h3>{__("reader.settings.spacing")}</h3>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab14">
                        <SVG ariaHidden svg={VolumeUpIcon} />
                        <h3>{__("reader.media-overlays.title")}</h3>
                    </Tabs.Trigger>
                    {/* <Tabs.Trigger value="tab15">
                        <SVG ariaHidden svg={ClockWiseIcon} />
                        <p>{__("reader.settings.save.title")}</p>
                    </Tabs.Trigger> */}
                </Tabs.List>
                <div>
                    <Tabs.Content value="tab11" tabIndex={-1}>
                        <FontSize />
                        <FontFamily />
                    </Tabs.Content>
                    <Tabs.Content value="tab12" tabIndex={-1}>
                        <ReadingTheme />
                        <ReadingDisplayLayout />
                        <ReadingDisplayAlign />
                        <ReadingDisplayCol />
                        <ReadingDisplayMathJax />
                    </Tabs.Content>
                    <Tabs.Content value="tab13" tabIndex={-1}>
                        <ReadingSpacing />
                    </Tabs.Content>
                    <Tabs.Content value="tab14" tabIndex={-1}>
                        <ReadingAudio />
                    </Tabs.Content>
                    {/* <Tabs.Content value="tab15" tabIndex={-1}>
                        <p>Maybe something is bro..</p>
                    </Tabs.Content> */}
                </div>
            </Tabs.Root>
        </section>
    );
};
