import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Wand2,
  BookOpen,
  Layers,
  Clock,
  CheckCircle,
  Copy,
  Save,
  PlaySquare,
  RefreshCw,
  Film,
} from "lucide-react";
import { db, hydrate, subscribeDb } from "../../lib/mock/db";
import type { Category, SeriesCoverGradient } from "../../lib/mock/types";

interface GeneratedBeat {
  timestamp: string;
  narrativeSw: string;
  visualPrompt: string;
}

interface GeneratedStory {
  titleSw: string;
  titleEn: string;
  descriptionSw: string;
  descriptionEn: string;
  categorySlug: string;
  coverGradient: SeriesCoverGradient;
  targetDurationSec: number;
  moralSw: string;
  beats: GeneratedBeat[];
}

const PRESETS = [
  {
    label: "Nabii Yusuf na Ndoto ya Nyota",
    categorySlug: "manabii",
    prompt: "Kisa cha subira na uaminifu cha Nabii Yusuf (A.S) kuanzia kisimani hadi Misri",
    duration: 120,
  },
  {
    label: "Bilal Ibn Rabah na Ushujaa wa Tawhid",
    categorySlug: "maswahaba",
    prompt: "Uvumilivu wa Bilal chini ya jua kali la Makka na wito wa Ahadun Ahad",
    duration: 140,
  },
  {
    label: "Imam Malik na Adabu ya Hadithi",
    categorySlug: "wanazuoni",
    prompt: "Jinsi Imam wa Darul Hijrah alivyoiheshimu Hadithi za Mtume (S.A.W) Madinah",
    duration: 110,
  },
  {
    label: "Adabu ya Kula na Kushukuru kwa Watoto",
    categorySlug: "watoto",
    prompt: "Kuelimisha watoto kutaja Bismillah kwa mkono wa kulia na kumshukuru Mungu",
    duration: 95,
  },
];

export default function AiContentGeneratorPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedCatSlug, setSelectedCatSlug] = useState("manabii");
  const [targetDuration, setTargetDuration] = useState(120);
  const [tone, setTone] = useState<"inspiring" | "educational" | "reflective">("inspiring");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedStory | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setCategories(db.categories.findMany());
    return subscribeDb(() => {
      setCategories(db.categories.findMany());
    });
  }, []);

  function handleSelectPreset(p: (typeof PRESETS)[0]) {
    setPrompt(p.prompt);
    setSelectedCatSlug(p.categorySlug);
    setTargetDuration(p.duration);
  }

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setSavedSuccess(false);
    try {
      const story = await db.ai.generateStory({
        prompt,
        categorySlug: selectedCatSlug,
        targetDurationSec: targetDuration,
        tone,
      });
      setResult(story);
    } catch (err: any) {
      alert(err?.message || "AI generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveToDatabase() {
    if (!result) return;
    try {
      await db.ai.publishStory(result);
      await hydrate();
      setSavedSuccess(true);
    } catch (err: any) {
      alert(err?.message || "Could not publish story");
    }
  }

  function handleCopyScript() {
    if (!result) return;
    const text = `
TITLE (SW): ${result.titleSw}
TITLE (EN): ${result.titleEn}
DURATION: ${result.targetDurationSec}s (Target: 90s - 180s)
MORAL: ${result.moralSw}

--- SCRIPT SCENES & TIMECODES ---
${result.beats
  .map(
    (b) => `
[${b.timestamp}]
NARRATION (Kiswahili):
${b.narrativeSw}

VISUAL PROMPT:
${b.visualPrompt}
`,
  )
  .join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-deep-green flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-gold" />
            AI Content Studio & Narrative Generator
          </h1>
          <p className="text-[13px] text-muted mt-0.5">
            Craft authentic Kiswahili Islamic narratives, 90-180s micro-scripts, and publish directly to series and episode catalogs.
          </p>
        </div>
      </div>

      {/* Preset Pills */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
          Quick Story Inspiration Presets:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSelectPreset(p)}
              className="text-xs bg-white hover:bg-sand border border-line rounded-xl px-3 py-1.5 font-semibold text-deep-green transition cursor-pointer shadow-2xs"
            >
              ★ {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Generator Inputs */}
        <div className="lg:col-span-5 rounded-2xl border border-line bg-white p-5 shadow-xs space-y-4">
          <h3 className="font-display text-base font-bold text-deep-green flex items-center gap-2 pb-3 border-b border-line">
            <Wand2 className="h-4 w-4 text-gold" />
            Story Configuration
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                Story Topic / Narrative Theme *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Subira ya Nabii Ayyub (A.S) katika maradhi na shukrani zake..."
                className="mt-1 w-full rounded-xl border border-line bg-sand/20 p-3 text-xs text-ink focus:bg-white focus:border-gold focus:outline-none transition font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Category Rail
                </label>
                <select
                  value={selectedCatSlug}
                  onChange={(e) => setSelectedCatSlug(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.nameSw} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                  Narrative Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-line bg-sand/20 px-3 py-2 text-xs font-semibold text-ink focus:bg-white focus:border-gold focus:outline-none cursor-pointer"
                >
                  <option value="inspiring">Inspiring & Moving</option>
                  <option value="educational">Educational & Instructive</option>
                  <option value="reflective">Reflective & Spiritual</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
                <span>Target Duration (Rule 7.3: 90s - 180s)</span>
                <span className="text-deep-green font-mono">{targetDuration} seconds</span>
              </div>
              <input
                type="range"
                min={90}
                max={180}
                step={5}
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                className="mt-2 w-full accent-deep-green cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>90s (Micro)</span>
                <span>135s (Optimal)</span>
                <span>180s (Full Darsa)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-deep-green hover:bg-teal disabled:opacity-50 text-warm-white text-xs font-bold py-3 rounded-xl transition shadow-xs cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-gold-light" />
                  <span>Synthesizing Authentic Story...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 text-gold-light" />
                  <span>Generate Complete Islamic Story</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-line bg-white p-5 shadow-xs flex flex-col justify-between min-h-[450px]">
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark bg-gold/15 px-2 py-0.5 rounded">
                    {result.categorySlug} · {result.targetDurationSec}s
                  </span>
                  <h3 className="font-display text-lg font-bold text-deep-green mt-1">
                    {result.titleSw}
                  </h3>
                  <p className="text-xs text-muted">{result.titleEn}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 text-xs border border-line rounded-lg px-2.5 py-1.5 font-bold text-ink hover:bg-sand/40 transition cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copied ? "Copied!" : "Copy Script"}</span>
                  </button>
                  <button
                    onClick={handleSaveToDatabase}
                    disabled={savedSuccess}
                    className="flex items-center gap-1 text-xs bg-gold hover:bg-gold-light disabled:bg-emerald-600 disabled:text-white text-deep-green rounded-lg px-3 py-1.5 font-bold transition shadow-xs cursor-pointer"
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Saved to Series!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Publish to App</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Moral & Description */}
              <div className="rounded-xl bg-sand/30 p-3 text-xs space-y-1 border border-line">
                <div className="font-bold text-deep-green">Mafunzo / Moral Lesson:</div>
                <div className="text-ink italic">"{result.moralSw}"</div>
              </div>

              {/* Story Beats */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-deep-green uppercase tracking-wider">
                  Narrative Scenes & Pacing ({result.beats.length} beats):
                </div>
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {result.beats.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-line bg-sand/15 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-gold-dark font-mono">
                        <span>{b.timestamp}</span>
                        <span className="text-muted font-sans">Scene #{idx + 1}</span>
                      </div>
                      <p className="text-ink leading-relaxed font-medium">{b.narrativeSw}</p>
                      <div className="text-[11px] text-muted flex items-center gap-1 pt-1 border-t border-line/50">
                        <Film className="h-3 w-3 shrink-0 text-teal" />
                        <span className="truncate">{b.visualPrompt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted p-8">
              <Sparkles className="h-12 w-12 text-gold/60 mb-3" />
              <div className="font-display text-base font-bold text-deep-green">
                Ready to Generate Stories
              </div>
              <p className="text-xs text-muted max-w-sm mt-1">
                Select a preset or input your custom topic on the left. The generator produces dual-language metadata, scene beats, and time-stamped narrations matching the 90-180s micro-story format.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
