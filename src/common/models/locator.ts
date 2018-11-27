export interface Locator {
    href: string;
    title?: string;
    text?: LocatorText;
    locations: LocatorLocations;
}

export interface LocatorText {
    before?: string;
    highlight?: string;
    after?: string;
}

export interface LocatorLocations {
    cfi?: string;
    cssSelector?: string;
    position?: number;
    progression?: number;
}
