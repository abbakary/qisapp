/** Cover gradient presets, keyed by the `coverGradient` string on Series. */
export const GRADIENTS: Record<string, string> = {
  teal: "linear-gradient(150deg, #1E8477 0%, #0F3D2E 100%)",
  forest: "linear-gradient(150deg, #3B5744 0%, #14261D 100%)",
  gold: "linear-gradient(150deg, #C9A227 0%, #8A6E19 100%)",
  deep: "linear-gradient(150deg, #15665C 0%, #0A2A20 100%)",
  olive: "linear-gradient(150deg, #8A6E19 0%, #4A3B0E 100%)",
  emerald: "linear-gradient(150deg, #2E5A4C 0%, #0F3D2E 100%)",
};

export const GRADIENT_KEYS = Object.keys(GRADIENTS);

export function gradientFor(key: string | null | undefined): string {
  return (key && GRADIENTS[key]) || GRADIENTS.teal;
}
