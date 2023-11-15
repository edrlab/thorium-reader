import * as React from "react";
// import { DialogCloseButton } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";

import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";

import * as Tabs from "@radix-ui/react-tabs";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as TextAreaIcon from "readium-desktop/renderer/assets/icons/textarea-icon.svg";
import * as LayoutIcon from "readium-desktop/renderer/assets/icons/layout-icon.svg";
import * as AlignLeftIcon from "readium-desktop/renderer/assets/icons/alignleft-icon.svg";
import * as VolumeUpIcon from "readium-desktop/renderer/assets/icons/volup-icon.svg";
import * as ClockWiseIcon from "readium-desktop/renderer/assets/icons/clockwise-icon.svg";
import classNames from "classnames";

// const TabTitle = (props: any) => {
//     return (
//         <div className={stylesSettings.settings_tab_title}>
//             <h2>{props.title}</h2>
//             <DialogCloseButton />
//         </div>
//     )
// }

const ReadingOptions = () => {
    const [ __ ] = useTranslator();
    return (
        <section className={stylesSettings.settings_tab_container_reading}>
            <Tabs.Root defaultValue="tab11" data-orientation="horizontal">
                <Tabs.List className={stylesSettings.tablist_reading} aria-orientation="horizontal">
                    <Tabs.Trigger value="tab11">
                        <SVG ariaHidden svg={TextAreaIcon}/>
                        <p>{__("reader.settings.text")}</p>
                        </Tabs.Trigger>
                    <Tabs.Trigger value="tab12">
                        <SVG ariaHidden svg={LayoutIcon}/>
                        <p>{__("reader.settings.display")}</p>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab13">
                        <SVG ariaHidden svg={AlignLeftIcon}/>
                        <p>{__("reader.settings.spacing")}</p>
                        </Tabs.Trigger>
                    <Tabs.Trigger value="tab14">
                        <SVG ariaHidden svg={VolumeUpIcon} />
                        <p>{__("reader.media-overlays.title")}</p>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="tab15">
                        <SVG ariaHidden svg={ClockWiseIcon} />
                        <p>{__("reader.settings.save.title")}</p>
                    </Tabs.Trigger>
                </Tabs.List>
                <div className={stylesSettings.settings_content}>
                    <Tabs.Content value="tab11" title="General">
                        <p>This is a Test</p>
                    </Tabs.Content>
                    <Tabs.Content value="tab12">
                        <p> This is some awesome content</p>
                    </Tabs.Content>
                    <Tabs.Content value="tab13">
                        <p>Go on, keep testing</p>
                    </Tabs.Content>
                    <Tabs.Content value="tab14">
                        <p>We never know..</p>
                    </Tabs.Content>
                    <Tabs.Content value="tab15">
                        <p>Maybe something is bro..</p>
                    </Tabs.Content>
                </div>
            </Tabs.Root>
        </section>
    )
}

export default ReadingOptions;