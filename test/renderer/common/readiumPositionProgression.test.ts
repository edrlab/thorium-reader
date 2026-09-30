import { expect, test } from "@jest/globals";

import type { I18nFunction } from "readium-desktop/common/services/translator";
import {
    formatReadiumFooterPositionProgression,
    formatReadiumPositionProgression,
    formatReadiumResourceProgression,
} from "readium-desktop/renderer/common/readiumPositionProgression";

test("formats the localized resource progression", () => {
    const translate = ((key: string, values: Record<string, string>) => {
        expect(key).toBe("publication.progression.resourceOfTotal");
        return `Resources ${values.resource}/${values.total}${values.title} [${values.progression}%]`;
    }) as I18nFunction;

    expect(
        formatReadiumResourceProgression(translate, {
            progression: 0.38,
            resource: 29,
            title: "Moby-Dick",
            totalResources: 142,
        }),
    ).toBe("Resources 29/142 (Moby-Dick) [38%]");
});

test("formats the localized publication position hint", () => {
    const translate = ((key: string, values: Record<string, string>) => {
        expect(key).toBe("publication.progression.positionOfTotal");
        return (
            `Position ${values.position} of ${values.total} ` +
            `[${values.first}/${values.last}] - ${values.progression}% of the publication.`
        );
    }) as I18nFunction;

    expect(
        formatReadiumPositionProgression(translate, {
            firstPosition: 98,
            lastPosition: 112,
            position: 104,
            totalPositions: 241,
            totalProgression: 0.43,
        }),
    ).toBe("Position 104 of 241 [98/112] - 43% of the publication.");
});

test("formats the compact footer position progression", () => {
    const translate = ((key: string, values: Record<string, string>) => {
        expect(key).toBe("publication.progression.footerPositionOfTotal");
        return (
            `Position ${values.position} of ${values.total} ` +
            `[${values.first}/${values.last}] (${values.progression}%)`
        );
    }) as I18nFunction;

    expect(
        formatReadiumFooterPositionProgression(translate, {
            firstPosition: 133,
            lastPosition: 137,
            position: 135,
            totalPositions: 653,
            totalProgression: 0.21,
        }),
    ).toBe("Position 135 of 653 [133/137] (21%)");
});
