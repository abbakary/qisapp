export type EpisodeCoverInput = {
  order: number;
  title: string;
  seriesTitle?: string;
};

const PALETTES: Array<[string, string, string]> = [
  ["#1E8477", "#0F3D2E", "#E7C767"],
  ["#C9A227", "#4A3B0E", "#FAF6EC"],
  ["#15665C", "#071B14", "#E7C767"],
  ["#3B5744", "#14261D", "#C9A227"],
  ["#8A6E19", "#2E2004", "#FFF3D1"],
  ["#2E5A4C", "#0A2A20", "#E7C767"],
];

const coverCache = new Map<string, string>();

function paletteFor(order: number) {
  return PALETTES[Math.max(0, order - 1) % PALETTES.length];
}

/** Audio-only fallback art (videos always use a real frame). */
export function episodeCoverDataUrl(input: EpisodeCoverInput): string {
  const key = `${input.order}|${input.title}|${input.seriesTitle || ""}`;
  const cached = coverCache.get(key);
  if (cached) return cached;

  const w = 640;
  const h = 360;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const [c0, c1, accent] = paletteFor(input.order);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, c0);
  grad.addColorStop(1, c1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.fillStyle = accent;
  ctx.font = `800 ${Math.round(h * 0.09)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(`EP ${String(input.order).padStart(2, "0")}`, w * 0.06, h * 0.78);
  ctx.fillStyle = "#FAF6EC";
  ctx.font = `700 ${Math.round(h * 0.075)}px "Amiri", ui-serif, Georgia, serif`;
  ctx.fillText(input.title || `Episode ${input.order}`, w * 0.06, h * 0.9);

  const url = canvas.toDataURL("image/jpeg", 0.8);
  coverCache.set(key, url);
  return url;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.72): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("poster"))), "image/jpeg", quality);
  });
}

function grabOneFrame(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => finish(new Error("timeout")), 1500);

    const finish = (err?: Error, blob?: Blob) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (blob) resolve(blob);
      else reject(err || new Error("Could not read a video frame"));
    };

    const snap = () => {
      try {
        const maxW = 640;
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 360;
        const scale = Math.min(1, maxW / vw);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(vw * scale));
        canvas.height = Math.max(1, Math.round(vh * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx || canvas.width < 2) {
          finish(new Error("empty frame"));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvasToJpeg(canvas).then((blob) => finish(undefined, blob)).catch((e) => finish(e));
      } catch (e) {
        finish(e instanceof Error ? e : new Error("snapshot failed"));
      }
    };

    video.addEventListener("loadeddata", snap, { once: true });
    video.addEventListener("error", () => finish(new Error("Could not read video")), { once: true });
    if (video.readyState >= 2) snap();
  });
}

export function captureVideoPoster(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = objectUrl;
    grabOneFrame(video)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        video.removeAttribute("src");
        video.load();
        URL.revokeObjectURL(objectUrl);
      });
  });
}

export async function prepareEpisodePoster(opts: {
  file?: File | null;
  mediaType: "AUDIO" | "VIDEO";
  order: number;
  title: string;
  seriesTitle?: string;
}): Promise<File> {
  const fallback = dataUrlToFile(
    episodeCoverDataUrl({
      order: opts.order,
      title: opts.title,
      seriesTitle: opts.seriesTitle,
    }),
  );
  const isVideoFile = Boolean(opts.file && (opts.file.type.startsWith("video") || opts.mediaType === "VIDEO"));
  if (opts.file && isVideoFile) {
    try {
      const blob = await captureVideoPoster(opts.file);
      if (blob && blob.size > 800) return new File([blob], "poster.jpg", { type: "image/jpeg" });
    } catch {
      /* canvas art is better than a missing cover */
    }
  }
  return fallback;
}

export function dataUrlToFile(dataUrl: string, name = "poster.jpg"): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([new Blob([bytes], { type: mime })], name, { type: mime });
}
