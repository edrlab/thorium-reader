// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { Switch } from "readium-desktop/renderer/common/components/Switch";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerActions } from "readium-desktop/common/redux/actions";

export const AllowCustom = () => {
    const [__] = useTranslator();
    const overridePublisherDefault = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const deactivateTextFormatting = !overridePublisherDefault;
    const dispatch = useDispatch();

    const onAllowCustomChange = React.useCallback((isSelected: boolean) => {
        dispatch(readerActions.allowCustom.build(!isSelected));
    }, [dispatch]);

    return (
        <Switch
            id="allow-custom"
            style={{ flexGrow: "unset" }}
            aria-label={__("reader.settings.deactivateTextFormatting")}
            isSelected={deactivateTextFormatting}
            onChange={onAllowCustomChange}
        >
        </Switch>
    );
};
