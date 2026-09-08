import React from "react";
import type { MediaType } from "../../lib/mock/types";

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mediaUrl: string;
  mediaType: MediaType;
  posterUrl?: string | null;
}

export default function MediaPreviewModal({
  isOpen,
  onClose,
  title,
  mediaUrl,
  mediaType,
  posterUrl,
}: MediaPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-deep-green text-warm-white p-5 shadow-2xl border border-gold/30">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="truncate pr-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-light">
              {mediaType} Preview
            </span>
            <h3 className="font-display text-base font-bold truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-warm-white/70 hover:text-warm-white text-lg p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-black/40 p-4 min-h-[200px]">
          {mediaType === "VIDEO" ? (
            <video
              src={mediaUrl}
              poster={posterUrl || undefined}
              controls
              autoPlay
              className="w-full max-h-[340px] rounded-lg object-contain bg-black"
            />
          ) : (
            <div className="w-full text-center space-y-4">
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={title}
                  className="mx-auto h-32 w-32 rounded-xl object-cover shadow-lg border border-gold/30"
                />
              )}
              <audio src={mediaUrl} controls autoPlay className="w-full" />
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between items-center text-[11px] text-warm-white/60">
          <span className="truncate">URL: {mediaUrl}</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-gold/20 hover:bg-gold/30 text-gold-light px-3 py-1.5 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
