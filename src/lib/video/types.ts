export type Motif =
  | "desert"
  | "stars"
  | "light"
  | "water"
  | "geometric"
  | "dusk";

export type Scene = {
  id: string;
  narrationSw: string;
  narrationEn: string;
  motif: Motif;
  headline?: string;
  seconds: number;
};

export const MOTIFS: Record<Motif, { label: string; desc: string; bg: string }> = {
  desert: {
    label: "Desert Dunes",
    desc: "Warm terracotta and gold sand gradient",
    bg: "radial-gradient(circle at 50% 30%, #C9A227 0%, #4A3B0E 60%, #1c1b14 100%)",
  },
  stars: {
    label: "Night Sky & Stars",
    desc: "Deep celestial blue with sparkling stars",
    bg: "radial-gradient(circle at 50% 20%, #1E8477 0%, #0F3D2E 50%, #071913 100%)",
  },
  light: {
    label: "Radiant Light",
    desc: "Golden luminous rays of guidance",
    bg: "radial-gradient(circle at 50% 40%, #E7C767 0%, #8A6E19 50%, #0F3D2E 100%)",
  },
  water: {
    label: "Nile Waters & Sea",
    desc: "Deep emerald and oceanic teal caustics",
    bg: "radial-gradient(circle at 50% 50%, #15665C 0%, #0A2A20 60%, #051410 100%)",
  },
  geometric: {
    label: "Arabesque Geometry",
    desc: "Sacred Khatam tessellation pattern",
    bg: "linear-gradient(135deg, #0F3D2E 0%, #1E8477 50%, #0F3D2E 100%)",
  },
  dusk: {
    label: "Dusk & Reflection",
    desc: "Rich twilight gradient of contemplation",
    bg: "radial-gradient(circle at 50% 70%, #8A6E19 0%, #15665C 50%, #0A1F17 100%)",
  },
};

export const MOTIF_KEYS = Object.keys(MOTIFS) as Motif[];
