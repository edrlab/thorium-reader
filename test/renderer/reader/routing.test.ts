import { expect, test } from "@jest/globals";

import {
    buildReaderMenuRoute,
    isReaderMenuRouteGroup,
} from "readium-desktop/renderer/reader/routing";

test("reader menu routes encode annotation and bookmark targets", () => {
    expect(buildReaderMenuRoute("annotation", "note 1/2", true)).toBe("/reader/menu/annotation/note%201%2F2?edit=1");
    expect(buildReaderMenuRoute("bookmark", "bookmark-1")).toBe("/reader/menu/bookmark/bookmark-1");
});

test("reader menu routes persist publication note sort filters", () => {
    expect(buildReaderMenuRoute("annotation", "note-1", { sort: "progression" })).toBe("/reader/menu/annotation/note-1?sort=progression");
    expect(buildReaderMenuRoute("annotation", "note-1", { edit: true, sort: "lastModified" })).toBe("/reader/menu/annotation/note-1?edit=1&sort=lastModified");
});

test("reader menu route groups are limited to publication note menu tabs", () => {
    expect(isReaderMenuRouteGroup("annotation")).toBe(true);
    expect(isReaderMenuRouteGroup("bookmark")).toBe(true);
    expect(isReaderMenuRouteGroup("search")).toBe(false);
    expect(isReaderMenuRouteGroup(undefined)).toBe(false);
});
