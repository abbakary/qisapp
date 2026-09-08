export type GivingCampaign = {
  id: "friday" | "ramadan" | "dhul-hijjah";
  titleSw: string;
  titleEn: string;
  blurbSw: string;
  blurbEn: string;
};

function inRange(d: Date, start: string, end: string): boolean {
  const t = d.toISOString().slice(0, 10);
  return t >= start && t <= end;
}

/** Approximate Hijri windows for 2026–2027; Friday is always live. */
export function activeGivingCampaign(now = new Date()): GivingCampaign | null {
  if (inRange(now, "2026-02-18", "2026-03-20") || inRange(now, "2027-02-08", "2027-03-10")) {
    return {
      id: "ramadan",
      titleSw: "Ramadhan — sadaqah ya hadithi",
      titleEn: "Ramadan — sponsor a story",
      blurbSw: "Mwezi wa kutoa. Dhamini hadithi ili mtoto mwingine asikilize bure.",
      blurbEn: "A month of giving. Sponsor a story so another child can listen for free.",
    };
  }
  if (inRange(now, "2026-05-19", "2026-05-29") || inRange(now, "2027-05-08", "2027-05-18")) {
    return {
      id: "dhul-hijjah",
      titleSw: "Siku 10 za Dhul-Hijjah",
      titleEn: "The 10 days of Dhul-Hijjah",
      blurbSw: "Siku bora za kutoa. Dhamini ufikiaji wa bure — bila jina, bila sifa.",
      blurbEn: "The best days to give. Sponsor free access — anonymous by default.",
    };
  }
  if (now.getDay() === 5) {
    return {
      id: "friday",
      titleSw: "Ijumaa — sadaqah ya wiki",
      titleEn: "Friday — weekly sadaqah",
      blurbSw: "Dhamini hadithi leo. Athari inaonekana: watoto wanaofikia, si majina ya wafadhili.",
      blurbEn: "Sponsor a story today. We show impact — children reached, not donor names.",
    };
  }
  return null;
}
