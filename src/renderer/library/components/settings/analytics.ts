// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { logEvent } from "readium-desktop/renderer/common/analytics";

type TAppSettingName =
    "language" |
    "screenreader" |
    "theme" |
    "storage" |
    "remove_expired" |
    "pnb" |
    "custom_annot_template" |
    "default_annot_template" |
    "minimize_library_to_tray" |
    "minimize_library" |
    "keep_library_background" |
    "user_one_reader_window";

export const logAppSettingModified = (
    settingName: TAppSettingName,
    settingValue: string | number | boolean,
): void => {
    logEvent(`app_setting_${settingName}`, {
        setting_value: `${settingValue}`,
    });
};
