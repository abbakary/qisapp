import type { Episode, Series, SeriesUnlock, SessionUser } from "./mock/types";

export const FREE_EPISODE_COUNT = 3;

export function isFreeEpisode(episode: Episode | null | undefined): boolean {
  if (!episode) return false;
  const order = Number(episode.order);
  if (!Number.isFinite(order) || order <= 0) return false;
  return order <= FREE_EPISODE_COUNT;
}

export function isVipUser(user: SessionUser | null | undefined): boolean {
  return user?.subscriptionStatus === "ACTIVE";
}

export function ownsSeries(
  seriesId: string | null | undefined,
  user: SessionUser | null | undefined,
  unlocks: SeriesUnlock[] = [],
): boolean {
  if (!seriesId) return false;
  if (isVipUser(user)) return true;
  if (!user?.id) return false;
  return unlocks.some((u) => u.seriesId === seriesId && u.status === "ACTIVE");
}

export function isStoryOfTheWeek(series: Series | null | undefined, storyOfWeekId?: string | null): boolean {
  if (!series || !storyOfWeekId) return false;
  return series.id === storyOfWeekId;
}

export function canPlayEpisode(
  episode: Episode | null | undefined,
  user: SessionUser | null | undefined,
  opts?: {
    series?: Series | null;
    unlocks?: SeriesUnlock[];
    storyOfWeekId?: string | null;
  },
): boolean {
  if (!episode) return false;
  if (isFreeEpisode(episode)) return true;
  if (opts?.series && isStoryOfTheWeek(opts.series, opts.storyOfWeekId)) return true;
  if (ownsSeries(episode.seriesId, user, opts?.unlocks || [])) return true;
  return false;
}

export function seriesUnlockPrice(series: Series | null | undefined, episodeCount = 0): number {
  if (series?.unlockPriceTzs && series.unlockPriceTzs > 0) return series.unlockPriceTzs;
  if (episodeCount <= 6) return 500;
  if (episodeCount <= 14) return 1000;
  return 1500;
}

export function formatTzs(amount: number): string {
  return `${amount.toLocaleString()} TZS`;
}
