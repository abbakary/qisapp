import { MOTIFS, type Scene } from "./types";

/**
 * Client-side canvas / animation generator for video studio scenes.
 */
export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  timeSec: number,
  totalSceneSec: number
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Background
  const motifInfo = MOTIFS[scene.motif] ?? MOTIFS.desert;
  const cx = width / 2;
  const cy = height / 2;

  const grad = ctx.createRadialGradient(cx, cy * 0.7, 10, cx, cy, width * 0.8);
  if (scene.motif === "desert") {
    grad.addColorStop(0, "#E7C767");
    grad.addColorStop(0.4, "#C9A227");
    grad.addColorStop(0.8, "#4A3B0E");
    grad.addColorStop(1, "#1C1B14");
  } else if (scene.motif === "stars") {
    grad.addColorStop(0, "#1E8477");
    grad.addColorStop(0.5, "#0F3D2E");
    grad.addColorStop(1, "#071913");
  } else if (scene.motif === "light") {
    grad.addColorStop(0, "#FFF3D1");
    grad.addColorStop(0.3, "#E7C767");
    grad.addColorStop(0.7, "#8A6E19");
    grad.addColorStop(1, "#0F3D2E");
  } else if (scene.motif === "water") {
    grad.addColorStop(0, "#28A798");
    grad.addColorStop(0.5, "#15665C");
    grad.addColorStop(0.9, "#0A2A20");
    grad.addColorStop(1, "#040E0B");
  } else if (scene.motif === "geometric") {
    grad.addColorStop(0, "#1E8477");
    grad.addColorStop(0.6, "#0F3D2E");
    grad.addColorStop(1, "#081E17");
  } else {
    grad.addColorStop(0, "#C9A227");
    grad.addColorStop(0.5, "#15665C");
    grad.addColorStop(1, "#0A1F17");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Animated Islamic Geometry / Particles
  ctx.save();
  ctx.translate(cx, cy * 0.7);
  const rot = timeSec * 0.15;
  ctx.rotate(rot);
  ctx.strokeStyle = "rgba(231, 199, 103, 0.22)";
  ctx.lineWidth = 2;

  // Draw Khatam Star in background
  const r = Math.min(width, height) * 0.22;
  for (let square = 0; square < 2; square++) {
    ctx.beginPath();
    ctx.rotate((square * Math.PI) / 4);
    ctx.rect(-r, -r, r * 2, r * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Subtle pulsing border
  ctx.strokeStyle = "rgba(201, 162, 39, 0.4)";
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 3. Headline Text (if any)
  if (scene.headline) {
    ctx.fillStyle = "#FAF6EC";
    ctx.font = `bold ${Math.round(height * 0.065)}px Amiri, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 12;
    ctx.fillText(scene.headline, cx, height * 0.25);
  }

  // 4. Kinetic Swahili Narration Caption
  if (scene.narrationSw) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 ${Math.round(height * 0.045)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 14;

    const words = scene.narrationSw.split(" ");
    const progress = Math.min(1, timeSec / (totalSceneSec || 1));
    const activeWordIdx = Math.floor(progress * words.length);

    // Render multi-line wrapped text
    wrapText(ctx, scene.narrationSw, cx, height * 0.65, width * 0.82, Math.round(height * 0.06));
  }

  // 5. English Subtitle (if any)
  if (scene.narrationEn) {
    ctx.fillStyle = "#E7C767";
    ctx.font = `400 ${Math.round(height * 0.032)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 10;
    wrapText(ctx, scene.narrationEn, cx, height * 0.82, width * 0.85, Math.round(height * 0.045));
  }

  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}
