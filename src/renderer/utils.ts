export function buildOpdsBrowserRoute(
    rootFeedIdentifier: string,
    title: string,
    url: string,
    level?: number,
) {
    if (level == null) {
        level = 1;
    }
    const route = `/opds/${rootFeedIdentifier}/browse/` + level
        + `/${btoa(title)}/${btoa(url)}`;
    return route;
}

export function parseOpdsBrowserRoute(route: string) {
    // Parse route with regexp
    // tslint:disable-next-line:max-line-length
    const regexp =  /\/opds\/([a-zA-Z0-9-=]+)\/browse\/([0-9]+)\/([a-zA-Z0-9=]+)\/([a-zA-Z0-9=]+)/g;
    const match = regexp.exec(route);

    if (match == null) {
        return null;
    }

    const rootFeedIdentifier = match[1];
    const level = parseInt(match[2], 10);
    const title = atob(match[3]);
    const url = atob(match[4]);

    return {
        rootFeedIdentifier,
        title,
        url,
        level,
    };
}
