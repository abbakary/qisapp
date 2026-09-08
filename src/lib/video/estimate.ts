/** Estimate spoken duration in seconds at Swahili reading pace (~130 wpm). */
export function estimateSeconds(text: string | null | undefined): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round((words / 130) * 60));
}
