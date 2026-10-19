import { WindowSender } from "readium-desktop/common/models/sync";

interface ToastRoutingAction {
    payload?: { publicationIdentifier?: string };
    destination?: { identifier?: string };
    sender?: Partial<WindowSender>;
}

// A notification belongs to one window, even when the same book is open twice.
export function getToastDestination(
    action: ToastRoutingAction,
    libraryIdentifier: string | undefined,
    readers: { identifier: string; publicationIdentifier: string }[],
): string | undefined {
    if (action.destination?.identifier) {
        return action.destination.identifier;
    }
    const publicationIdentifier = action.payload?.publicationIdentifier;
    if (publicationIdentifier) {
        const matchingReaders = readers.filter((reader) => reader.publicationIdentifier === publicationIdentifier);
        return matchingReaders.find((reader) => reader.identifier === action.sender?.identifier)?.identifier
            || matchingReaders[0]?.identifier || libraryIdentifier;
    }
    return action.sender?.identifier || libraryIdentifier;
}
