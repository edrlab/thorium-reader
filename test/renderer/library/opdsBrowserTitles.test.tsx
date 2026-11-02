import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, jest, test } from "@jest/globals";
import { opdsBreadcrumbReducer } from "readium-desktop/renderer/library/redux/reducers/opds";
import { browseRequest, breadcrumbTitleUpdate } from "readium-desktop/renderer/library/redux/actions/opds";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";

jest.mock("readium-desktop/renderer/library/routing", () => ({ routes: {}, resolveDisplayType: () => "list" }));
jest.mock("readium-desktop/renderer/assets/styles/components/catalogs.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/forbidden-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/chevron-right.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: () => <span /> }));
jest.mock("readium-desktop/renderer/library/components/opds/BrowserResult", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("readium-desktop/renderer/library/components/opds/SearchForm", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("readium-desktop/renderer/library/components/layout/LibraryLayout", () => ({ __esModule: true,
    default: (props: { title: string; catalogHeader: React.ReactNode }) => <><h1>{props.title}</h1>{props.catalogHeader}</> }));
const mockCatalogs: Record<string, string> = { a: "My library", b: "Another library" };
let mockPath = "";
let mockBreadcrumb: ReturnType<typeof opdsBreadcrumbReducer>;
jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({
    useApi: (id: string) => [{ data: { result: { title: mockCatalogs[id.split(":")[1]] } } }, () => {}],
}));
jest.mock("readium-desktop/renderer/common/hooks/useSelector", () => ({ useSelector: (select: (state: unknown) => unknown) =>
    select({ opds: { browser: { breadcrumb: mockBreadcrumb } }, router: { location: { pathname: mockPath } }, settings: {} }) }));
jest.mock("readium-desktop/renderer/common/hooks/useDispatch", () => ({ useDispatch: () => jest.fn() }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
jest.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: mockPath }),
    Link: (props: { to: { pathname: string }; children: React.ReactNode }) => <a href={props.to.pathname}>{props.children}</a> }));
import { Browser } from "readium-desktop/renderer/library/components/opds/Browser";
const rootUrl = "https://example.org/catalog";
const childUrl = "https://example.org/crime";
const rootPath = buildOpdsBrowserRoute("a", "My library", rootUrl);
const render = () => renderToStaticMarkup(<Browser />);
beforeEach(() => {
    mockBreadcrumb = opdsBreadcrumbReducer(undefined, browseRequest.build("a", 1, "My library", rootUrl));
    mockPath = rootPath;
});

test("uses the card name for the heading and the loaded root title for the breadcrumb", () => {
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build(rootPath, "Online catalog"));
    const html = render();
    expect(html).toContain("<h1>My library</h1>");
    expect(html).toContain('aria-current="page">Online catalog</h4>');
    expect(mockBreadcrumb[1].path).toBe(rootPath);
});

test("retains the root feed title while displaying the current feed title", () => {
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build(rootPath, "Online catalog"));
    mockPath = buildOpdsBrowserRoute("a", "Mystery link", childUrl, 3);
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, browseRequest.build("a", 3, "Mystery link", childUrl));
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build(mockPath, "Crime"));
    const html = render();
    expect(html).toContain("<h1>My library</h1>");
    expect(html).toContain('href="'+rootPath+'">Online catalog</a>');
    expect(html).toContain('aria-current="page">Crime</h4>');
    expect(mockBreadcrumb.at(-1).path).toBe(mockPath);
});

test("keeps the navigation label for untitled feeds, including whitespace-only titles", () => {
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build(rootPath, "   "));
    expect(render()).toContain('aria-current="page">My library</h4>');
    mockPath = buildOpdsBrowserRoute("a", "New books", childUrl, 3);
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, browseRequest.build("a", 3, "New books", childUrl));
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build(mockPath, ""));
    expect(render()).toContain('aria-current="page">New books</h4>');
});

test("uses the card name when both feed title and navigation label are missing", () => {
    mockPath = buildOpdsBrowserRoute("a", "", rootUrl);
    mockBreadcrumb = opdsBreadcrumbReducer(undefined, browseRequest.build("a", 1, "", rootUrl));
    expect(render()).toContain('aria-current="page">My library</h4>');
});

test("direct Shelf entry and catalog switching do not use route labels for the heading", () => {
    mockPath = buildOpdsBrowserRoute("b", "Shelf", childUrl);
    mockBreadcrumb = opdsBreadcrumbReducer(undefined, browseRequest.build("b", 1, "Shelf", childUrl));
    expect(render()).toContain("<h1>Another library</h1>");
    expect(render()).toContain('aria-current="page">Shelf</h4>');
});

test("ignores late titles from another route and updates a refreshed feed title", () => {
    const previous = mockBreadcrumb;
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build("/other", "Wrong title"));
    expect(mockBreadcrumb).toEqual(previous);
    mockBreadcrumb = opdsBreadcrumbReducer(mockBreadcrumb, breadcrumbTitleUpdate.build(rootPath, " Updated catalog "));
    expect(mockBreadcrumb[1]).toEqual({ name: "Updated catalog", path: rootPath });
});
