import { expect, test } from "@jest/globals";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { isCancellableHold } from "readium-desktop/renderer/library/opds/holds";

test.each(["reserved", "ready", "available", "unavailable", undefined])(
    "only offers cancellation for cancellable holds in %s state", (state) => {
        const link = { properties: { availabilityState: state, cancellable: true } } as IOpdsLinkView;
        expect(isCancellableHold(link)).toBe(state === "reserved" || state === "ready");
        expect(isCancellableHold({ ...link, properties: { ...link.properties, cancellable: false } })).toBe(false);
        expect(isCancellableHold({ ...link, properties: { availabilityState: link.properties.availabilityState } })).toBe(false);
    },
);
