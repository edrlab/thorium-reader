import { describe, expect, it, jest } from "@jest/globals";
import { Cover } from "readium-desktop/renderer/common/components/Cover";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { URL_PROTOCOL_OPDS_MEDIA } from "readium-desktop/common/streamerProtocol";

jest.mock("readium-desktop/renderer/assets/styles/components/publications.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/spinnerContainer.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/icons/file-broken-icon.svg", () => ({}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({}));
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({
    withTranslator: (component: unknown) => component,
}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({}));
jest.mock("react-redux", () => ({ connect: () => (component: unknown) => component }));
jest.mock("readium-desktop/renderer/common/logics/formatContributor", () => ({}));

type Props = ConstructorParameters<typeof Cover>[0];
const coverUrl = "https://catalog.example/cover.jpg";
const thumbnailUrl = "https://catalog.example/thumbnail.jpg";

function props(url: string | undefined = coverUrl, coverType: Props["coverType"] = "cover"): Props {
    return {
        publicationViewMaybeOpds: {
            identifier: "test",
            cover: url ? { coverLinks: [{ url }], thumbnailLinks: [{ url: thumbnailUrl }] } : undefined,
        } as TPublication,
        coverType,
        locale: "en",
        lcp: undefined,
        __: (key: string) => key,
    } as Props;
}

// Exercise the component's lifecycle state transitions without mounting the
// Redux/translation wrappers. Actual HTTP fallback is checked in Electron.
function create(initial = props()) {
    const component = new Cover(initial);
    jest.spyOn(component, "setState").mockImplementation((update) => {
        const next = typeof update === "function" ? update(component.state, component.props) : update;
        Object.assign(component.state, next);
    });
    return component;
}

function update(component: Cover, next: Props) {
    const previous = component.props;
    Object.defineProperty(component, "props", { value: next, configurable: true });
    component.componentDidUpdate(previous);
}

function fail(component: Cover) {
    component["imageOnError"]();
}

describe("OPDS cover refresh", () => {
    it("preserves the authenticated fallback when a fresh cover object has the same URL", () => {
        const component = create();
        fail(component);
        const authenticatedUrl = component.state.imgUrl;
        expect(authenticatedUrl).toMatch(new RegExp(`^${URL_PROTOCOL_OPDS_MEDIA}:`));
        update(component, props());
        expect(component.state.imgUrl).toBe(authenticatedUrl);
        expect(component.state.imgErroredOnce).toBe(true);
    });

    it("allows a new authenticated retry when the cover URL changes", () => {
        const component = create();
        fail(component);
        update(component, props("https://catalog.example/new-cover.jpg"));
        expect(component.state.imgErroredOnce).toBe(false);
        expect(component.state.imgUrl).toBe("https://catalog.example/new-cover.jpg");
        fail(component);
        expect(component.state.imgUrl).toMatch(new RegExp(`^${URL_PROTOCOL_OPDS_MEDIA}:`));
    });

    it("updates when switching from cover to thumbnail on the same publication object", () => {
        const initial = props();
        const component = create(initial);
        fail(component);
        update(component, { ...initial, coverType: "thumbnail" });
        expect(component.state.imgUrl).toBe(thumbnailUrl);
        expect(component.state.imgErroredOnce).toBe(false);
    });

    it("clears a removed cover and permits authentication when a cover returns", () => {
        const component = create();
        fail(component);
        const withoutCover = props();
        withoutCover.publicationViewMaybeOpds.cover = undefined;
        update(component, withoutCover);
        expect(component.state.imgUrl).toBeUndefined();
        expect(component.state.imgErroredOnce).toBe(false);
        update(component, props());
        fail(component);
        expect(component.state.imgUrl).toMatch(new RegExp(`^${URL_PROTOCOL_OPDS_MEDIA}:`));
    });

    it("does not retry indefinitely if the authenticated fallback also fails", () => {
        const component = create();
        fail(component);
        const authenticatedUrl = component.state.imgUrl;
        fail(component);
        expect(component.state.imgUrl).toBe(authenticatedUrl);
    });
});
