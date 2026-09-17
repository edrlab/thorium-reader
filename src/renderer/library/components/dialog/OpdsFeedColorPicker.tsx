// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import * as React from "react";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import {
    opdsFeedColors,
    type TOpdsFeedColor,
} from "readium-desktop/common/models/opds";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { uuidv4 } from "readium-desktop/utils/uuid";

interface IProps {
    value: TOpdsFeedColor;
    onChange: (value: TOpdsFeedColor) => void;
}

type TOpdsFeedColorTranslatorKey = `opds.color.${TOpdsFeedColor}`;


// DO NOT REMOVE I18n static typing
// __("opds.color.gray")
// __("opds.color.red")
// __("opds.color.yellow")
// __("opds.color.blue")
// __("opds.color.green")
// __("opds.color.purple")
// __("opds.color.orange")
// __("opds.color.pink")

const getColorTranslatorKey = (color: TOpdsFeedColor): TOpdsFeedColorTranslatorKey =>
    `opds.color.${color}`;

export const OpdsFeedColorPicker: React.FC<IProps> = ({ value, onChange }) => {
    const uuid = React.useMemo(() => uuidv4(), []);
    const [__] = useTranslator();

    return (
        <div
            className={stylesCatalogs.catalog_color_picker}
            role="radiogroup"
            aria-label={__("opds.color.title")}
        >
            {opdsFeedColors.map((color) => {
                const label = __(getColorTranslatorKey(color));

                return (
                    <div key={`${uuid}_color-${color}`}>
                        <input
                            type="radio"
                            id={`${uuid}_color-${color}`}
                            name={`${uuid}_colorpicker`}
                            value={color}
                            onChange={() => onChange(color)}
                            checked={value === color}
                            aria-label={label}
                        />
                        <label
                            aria-hidden={true}
                            title={label}
                            htmlFor={`${uuid}_color-${color}`}
                            className={stylesCatalogs.catalog_color_swatch}
                            data-color={color}
                            data-selected={value === color || undefined}
                        >
                            {value === color ? <SVG ariaHidden svg={CheckIcon} /> : <></>}
                        </label>
                    </div>
                );
            })}
        </div>
    );
};
