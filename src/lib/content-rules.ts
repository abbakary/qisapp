/**
 * Product constraints for episodes & series. These are enforced in the admin
 * and surfaced in the UI.
 */

export const EPISODE_MIN_SEC = 90; // 1.5 min
export const EPISODE_MAX_SEC = 180; // 3 min

export const SERIES_MIN_EPISODES = 3; // practical minimum for publishing
export const SERIES_MAX_EPISODES = 30; // hard cap
export const SERIES_SOFT_MIN = 3; // nudge below this

export type DurationCheck = {
  ok: boolean; // within the hard 90–180s window
  level: "ok" | "warn";
  message: string | null;
};

export function checkDuration(durationSec: number): DurationCheck {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return { ok: false, level: "warn", message: "Duration is missing or invalid." };
  }
  if (durationSec < EPISODE_MIN_SEC || durationSec > EPISODE_MAX_SEC) {
    return {
      ok: false,
      level: "warn",
      message: `Episode is ${fmtDuration(durationSec)} — outside the 1.5–3 min (90–180s) target. You can still save it, but flag it for review.`,
    };
  }
  return { ok: true, level: "ok", message: null };
}

export type EpisodeCountCheck = {
  allowed: boolean; // may we add another episode?
  level: "ok" | "nudge" | "block";
  message: string | null;
};

/** Given the current episode count of a series, can we add one more? */
export function checkCanAddEpisode(currentCount: number): EpisodeCountCheck {
  if (currentCount >= SERIES_MAX_EPISODES) {
    return {
      allowed: false,
      level: "block",
      message: `This series already has ${SERIES_MAX_EPISODES} episodes — the maximum. Remove one before adding another.`,
    };
  }
  const nextCount = currentCount + 1;
  if (nextCount < SERIES_SOFT_MIN) {
    return {
      allowed: true,
      level: "nudge",
      message: `After this the series will have ${nextCount} episode(s). A series needs at least ${SERIES_MIN_EPISODES} to be publish-ready.`,
    };
  }
  return { allowed: true, level: "ok", message: null };
}

export function fmtDuration(totalSec: number): string {
  const s = Math.round(totalSec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function avgDuration(durations: number[]): number {
  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}
