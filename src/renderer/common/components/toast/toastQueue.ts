import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";

export function addToastToQueue(
    queue: Record<string, ToastState>,
    id: string,
    toast: ToastState,
    publicationIdentifier?: string,
): Record<string, ToastState> {
    if (!toast.open || !toast.data?.trim()
        || (toast.publicationIdentifier && publicationIdentifier && toast.publicationIdentifier !== publicationIdentifier)) {
        return queue;
    }
    // Suppress repeated errors/prerequisites only while they are visible. Once
    // dismissed, another attempt must be able to report the same failure again.
    if (toast.type !== ToastType.Success && Object.values(queue).some((current) =>
        current.type === toast.type && current.data === toast.data
        && current.publicationIdentifier === toast.publicationIdentifier)) {
        return queue;
    }
    return { ...queue, [id]: toast };
}
