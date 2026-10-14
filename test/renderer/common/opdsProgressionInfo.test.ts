// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ApiResponse } from "readium-desktop/common/redux/states/api";
import { TOpdsProgressionServiceStatus } from "readium-desktop/common/models/opdsProgression";

jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({ useApi: jest.fn() }));
jest.mock("readium-desktop/renderer/common/hooks/useSelector", () => ({ useSelector: () => "en" }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string, values?: { percent: number; device: string }) =>
        values ? `${key}: ${values.percent}% (${values.device})` : key],
}));

import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { OpdsProgressionInfo } from "readium-desktop/renderer/common/components/dialog/publicationInfos/OpdsProgressionInfo";

const render = (status?: TOpdsProgressionServiceStatus, url: string | undefined = "https://example.org/progression", error = false) => {
    const response = status || error ? { data: { result: status, error } } : undefined;
    jest.mocked(useApi).mockReturnValue([
        response as ApiResponse<TOpdsProgressionServiceStatus>, jest.fn(),
    ]);
    return renderToStaticMarkup(React.createElement(OpdsProgressionInfo, { url }));
};

describe("publication info remote progression status", () => {
    it("shows when sync is not enabled", () => {
        // Explicitly bypass the default URL.
        jest.mocked(useApi).mockReturnValue([undefined, jest.fn()]);
        expect(renderToStaticMarkup(React.createElement(OpdsProgressionInfo))).toContain("remoteProgression.disabled");
    });

    it("shows the pending check", () => {
        expect(render()).toContain("remoteProgression.checking");
    });

    it("shows unavailable for failed requests or invalid responses", () => {
        expect(render({ status: "unavailable" })).toContain("remoteProgression.unavailable");
        expect(render(undefined, undefined, true)).toContain("remoteProgression.unavailable");
    });

    it("shows ready without inventing a remote position", () => {
        const html = render({ status: "ready" });
        expect(html).toContain("remoteProgression.ready");
        expect(html).toContain("remoteProgression.empty");
        expect(html).not.toContain("remoteProgression.position");
    });

    it.each([0, 0.625, 1])("shows the returned percentage and safely renders the device at %s", (progression) => {
        const html = render({ status: "ready", document: {
            modified: "2026-10-14T10:00:00Z",
            progression,
            device: { id: "urn:uuid:test", name: "<Test reader>" },
        } });
        expect(html).toContain(`${Math.round(progression * 100)}% (&lt;Test reader&gt;)`);
        expect(html).toContain('role="status"');
        expect(html).not.toContain("remoteProgression.empty");
    });
});
