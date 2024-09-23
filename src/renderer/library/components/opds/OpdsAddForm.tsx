// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.scss";

import * as React from "react";
import ApiappAddFormDialog from "readium-desktop/renderer/library/components/dialog/ApiappAddForm";
import OpdsFeedAddForm from "../dialog/OpdsFeedAddForm";

const OpdsAddForm: React.FC = () => {
    return (
        <section style={{display: "flex", gap: "10px", alignItems: "end", height: "65px", justifyContent: "end", margin: "0"}}
        className={stylesHeader.nav_secondary}>
            <OpdsFeedAddForm/>
            <ApiappAddFormDialog/>
        </section>
    );

};

export default OpdsAddForm;
