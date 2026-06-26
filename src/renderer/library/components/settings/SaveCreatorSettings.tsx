// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
// import { DirectionProvider } from "@radix-ui/react-direction";
// import {I18nProvider} from 'react-aria';

import * as React from "react";
import SVG, { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { creatorActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import debounce from "debounce";
import { INoteCreator } from "readium-desktop/common/redux/states/creator";
import * as RadioGroup from "@radix-ui/react-radio-group";

interface IRadioGroupItemProps {
    value: string;
    svg?: ISVGProps;
    description: string;
    disabled?: boolean;
    className?: string;
    style?: any;
};

const RadioGroupItem = (props: IRadioGroupItemProps) => {
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    return (
        <RadioGroup.Item
            dir={isRTL ? "rtl" : "ltr"}
            data-input-type="radio"
            value={props.value} id={props.value} className={props.className} disabled={props.disabled} style={props.style}>
            {props.description}
        </RadioGroup.Item>
    );
};

const SaveCreatorSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const creator = useSelector((state: ICommonRootState) => state.creator);

    const [name, setName] = React.useState(creator.name);
    const [type, setType] = React.useState(creator.type);

    const onChangeDebounced = React.useMemo(() =>
        debounce(
            (name: string, type: INoteCreator["type"]) => dispatch(creatorActions.set.build(name, type))
            , 1000)
        , [dispatch]);
    React.useEffect(() => {
        if (name !== creator.name || type !== creator.type) {
            onChangeDebounced(name, type);
        }
    }, [name, type, creator, onChangeDebounced]);

    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.annotationCreator.creator")}</h3>
            <div className={stylesSettings.session_text} style={{ margin: "0" }}>
                <SVG ariaHidden svg={InfoIcon} />
                <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.annotationCreator.help")}</p>
            </div>
            <div className={stylesInput.form_group} style={{ marginTop: "20px", width: "360px"}}>
                <input dir={isRTL ? "rtl" : "ltr"} type="text" id='creator-name' aria-label={__("settings.annotationCreator.name")} name="creator-name" style={{ width: "100%", marginLeft: "10px" }} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" title={name} value={name} onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                }} />
                <label dir={isRTL ? "rtl" : "ltr"} htmlFor="creator-name">{__("settings.annotationCreator.name")}</label>
            </div>
            <RadioGroup.Root dir={isRTL ? "rtl" : "ltr"} orientation="horizontal" style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}
                value={type}
                onValueChange={(option: "Organization" | "Person") => setType(option)}
            >
                 <p dir={isRTL ? "rtl" : "ltr"}>{__("settings.annotationCreator.type")}</p>
                <RadioGroupItem value="Organization" description={`${__("settings.annotationCreator.organization")}`} className={stylesAnnotations.annotations_filter_tag} />
                <RadioGroupItem value="Person" description={`${__("settings.annotationCreator.person")}`} className={stylesAnnotations.annotations_filter_tag} />
            </RadioGroup.Root>
        </section>
    );
};

export default SaveCreatorSettings;
