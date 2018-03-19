export enum ActionType {
    LatestVersionSet = "UPDATE_LATEST_VERSION_SET",
}

export function setLatestVersion(
    latestVersion: string,
    latestVersionUrl: string,
) {
    return {
        type: ActionType.LatestVersionSet,
        payload: {
            latestVersion,
            latestVersionUrl,
        },
    };
}
