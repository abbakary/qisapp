import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { slugify } from "../../lib/slug";
import { db } from "../../lib/mock/db";

export default function NewCategoryPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nameSw, setNameSw] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [order, setOrder] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name || nameSw);

  function onFile(f: File | null) {
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const existing = db.categories.findBySlug(effectiveSlug);
    if (existing) {
      setBusy(false);
      setMsg({ ok: false, text: `Category slug "${effectiveSlug}" already exists.` });
      return;
    }

    const created = db.categories.create({
      name,
      nameSw,
      slug: effectiveSlug,
      order,
      image: preview || null,
    });

    setBusy(false);
    setMsg({
      ok: true,
      text: `Created "${created.nameSw}"${created.image ? " with a cover" : ""}. It now appears in the Aina nav & tiles.`,
    });
    setName("");
    setNameSw("");
    setSlug("");
    setSlugTouched(false);
    setPreview(null);
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-deep-green">New category</h1>
      <p className="mt-1 text-[12px] text-muted">
        Adding a row here is all it takes — the category tiles, filter chips and Aina nav all read
        from this table. No code changes.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">English name</span>
          <input className="field-box" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="field-label">Swahili name</span>
          <input className="field-box" value={nameSw} onChange={(e) => setNameSw(e.target.value)} required />
        </label>
        <label className="block">
          <span className="field-label">Slug</span>
          <input
            className="field-box"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </label>
        <label className="block">
          <span className="field-label">Order (lower shows first)</span>
          <input
            type="number"
            className="field-box"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </label>

        <div>
          <span className="field-label">Cover image (optional)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field-box"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-[11px] text-muted">
            Leave empty and a branded cover is generated automatically — the tile is never blank.
          </p>
          {preview && (
            <img src={preview} alt="" className="mt-2 h-28 w-full rounded-lg object-cover shadow-xs" />
          )}
        </div>

        {msg && (
          <p className={`text-[12px] font-semibold ${msg.ok ? "text-teal" : "text-red-700"}`}>
            {msg.text}
          </p>
        )}

        <button disabled={busy} className="btn-primary">
          {busy ? "Creating…" : "Create category"}
        </button>
      </form>
    </div>
  );
}
