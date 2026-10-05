import type { IAudioPlaybackInfo } from "@r2-navigator-js/electron/common/audiobook";

const positiveDuration = (value: number | undefined): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0;

export function completeAudiobookProgression(
    info: IAudioPlaybackInfo,
    href: string,
    spine: Array<{ Href: string; Duration?: number }>,
): IAudioPlaybackInfo {
    if (positiveDuration(info.globalDuration) && Number.isFinite(info.globalTime) &&
        Number.isFinite(info.globalProgression)) {
        return info;
    }
    const currentIndex = spine.findIndex((link) => link.Href === href);
    if (currentIndex < 0 || !Number.isFinite(info.localTime)) {
        return info;
    }
    const durations = spine.map((link, index) =>
        positiveDuration(link.Duration) ? link.Duration :
            index === currentIndex && positiveDuration(info.localDuration) ? info.localDuration : undefined);
    if (!durations.every(positiveDuration)) {
        return info;
    }
    const globalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const globalTime = Math.min(globalDuration, Math.max(0,
        durations.slice(0, currentIndex).reduce((sum, duration) => sum + duration, 0) +
        Math.min(durations[currentIndex], Math.max(0, info.localTime))));
    return { ...info, globalDuration, globalTime, globalProgression: globalTime / globalDuration };
}
