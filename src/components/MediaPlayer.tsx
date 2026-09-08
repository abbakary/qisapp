import React, { useCallback, useEffect, useRef, useState } from "react";
import { fmtDuration } from "../lib/content-rules";
import { db } from "../lib/mock/db";
import { useAuth } from "../context/AuthContext";

const HIDE_DELAY = 3000;

export default function MediaPlayer({
  episodeId,
  mediaUrl,
  mediaType,
  initialPosition,
  onCompleted,
  onNeedSave,
  poster,
  autoPlay = false,
}: {
  episodeId: string;
  mediaUrl: string;
  mediaType: "AUDIO" | "VIDEO";
  initialPosition: number;
  onCompleted?: () => void;
  onNeedSave?: () => void;
  poster?: string | null;
  autoPlay?: boolean;
}) {
  const { user } = useAuth();
  const ref = useRef<HTMLMediaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const [cur, setCur] = useState(initialPosition);
  const [dur, setDur] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const hideTimer = useRef<number | null>(null);
  const lastSaved = useRef(0);
  const seededRef = useRef(false);
  const askedSave = useRef(false);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const save = useCallback(
    (positionSec: number, completed: boolean) => {
      lastSaved.current = Date.now();
      if (user?.id)
        db.progress.upsert(user.id, episodeId, Math.round(positionSec), completed);
    },
    [episodeId, user?.id],
  );

  const onLoaded = () => {
    const el = ref.current;
    if (!el) return;
    setDur(el.duration || 0);
    if (!seededRef.current && initialPosition > 0 && initialPosition < (el.duration || Infinity) - 2)
      el.currentTime = initialPosition;
    seededRef.current = true;
    if (autoPlay) {
      el.play().catch(() => {});
    }
  };

  const onTime = () => {
    const el = ref.current;
    if (!el) return;
    setCur(el.currentTime);
    if (Date.now() - lastSaved.current > 4000) save(el.currentTime, false);
    if (!user?.id && !askedSave.current && el.currentTime >= 20) {
      askedSave.current = true;
      onNeedSave?.();
    }
  };

  const onEnded = () => {
    setPlaying(false);
    playingRef.current = false;
    setShowControls(true);
    save(ref.current?.duration ?? cur, true);
    onCompleted?.();
  };

  const scheduleHide = useCallback(() => {
    if (mediaType !== "VIDEO") return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playingRef.current) setShowControls(false);
    }, HIDE_DELAY);
  }, [mediaType]);

  const showAndScheduleHide = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  useEffect(() => {
    const handler = () => {
      const el = ref.current;
      if (el && el.currentTime > 0) save(el.currentTime, el.ended);
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("pagehide", handler);
      handler();
    };
  }, [save]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    if (playing && mediaType === "VIDEO") scheduleHide();
    else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(true);
    }
  }, [playing, mediaType, scheduleHide]);

  function syncPlayingFromElement() {
    const el = ref.current;
    if (!el) return;
    const next = !el.paused && !el.ended;
    playingRef.current = next;
    setPlaying(next);
  }

  function toggle(e?: React.MouseEvent) {
    e?.stopPropagation();
    const el = ref.current;
    if (!el) return;
    if (el.paused || el.ended) {
      el.play().catch(() => {});
    } else {
      el.pause();
      save(el.currentTime, false);
    }
    showAndScheduleHide();
  }

  function seek(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    e.stopPropagation();
    const el = ref.current;
    if (!el || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    el.currentTime = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * dur;
    setCur(el.currentTime);
    showAndScheduleHide();
  }

  function enterFullscreen(e?: React.MouseEvent) {
    e?.stopPropagation();
    setShowControls(true);
    setIsFullscreen(true);
  }

  function exitFullscreen(e?: React.MouseEvent) {
    e?.stopPropagation();
    setShowControls(true);
    setIsFullscreen(false);
  }

  const pct = dur ? (cur / dur) * 100 : 0;
  const mediaEvents = {
    onLoadedMetadata: onLoaded,
    onTimeUpdate: onTime,
    onEnded,
    onPlay: syncPlayingFromElement,
    onPause: syncPlayingFromElement,
  };

  const shellClass = isFullscreen
    ? "fixed inset-0 z-[9999]"
    : "absolute inset-0";

  return (
    <div
      className={
        mediaType === "VIDEO"
          ? "relative w-full bg-black"
          : "relative w-full h-[220px]"
      }
      style={mediaType === "VIDEO" ? { aspectRatio: "16/9" } : undefined}
    >
      <div
        ref={containerRef}
        className={`${shellClass} ${
          mediaType === "VIDEO" || isFullscreen ? "bg-black" : ""
        } ${
          !isFullscreen && mediaType === "AUDIO"
            ? "overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(231,199,103,0.18),transparent_60%),linear-gradient(200deg,#164E44,#08201A)]"
            : ""
        }`}
        onMouseMove={mediaType === "VIDEO" ? showAndScheduleHide : undefined}
        onTouchStart={mediaType === "VIDEO" ? showAndScheduleHide : undefined}
      >
        {mediaType === "VIDEO" ? (
          <video
            ref={ref as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            poster={poster ?? undefined}
            preload="none"
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            {...mediaEvents}
          />
        ) : (
          <>
            {poster && (
              <>
                <img
                  src={poster}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover ${
                    isFullscreen ? "opacity-20 scale-110 blur-sm" : "object-[50%_28%]"
                  }`}
                />
                <div
                  className={`absolute inset-0 ${
                    isFullscreen ? "bg-gradient-to-b from-black/30 via-transparent to-black/60" : "bg-[#0A1F17]/60"
                  }`}
                />
              </>
            )}
            <audio
              ref={ref as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              preload="none"
              {...mediaEvents}
            />
          </>
        )}

        {mediaType === "VIDEO" ? (
          <div
            className={`absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={toggle}
          >
            <div className="flex justify-end p-2.5 bg-gradient-to-b from-black/70 to-transparent">
              {isFullscreen ? (
                <button
                  onClick={exitFullscreen}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/50 text-white border border-white/20 backdrop-blur-sm active:scale-95 hover:bg-black/70 transition"
                  aria-label="Exit fullscreen"
                >
                  <ExitFullscreenIcon />
                </button>
              ) : (
                <button
                  onClick={enterFullscreen}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/55 text-white border border-white/15 backdrop-blur-sm active:scale-95 hover:bg-black/75 transition"
                  aria-label="Fullscreen"
                >
                  <EnterFullscreenIcon />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center pointer-events-none">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white border border-white/25 backdrop-blur-sm sm:h-16 sm:w-16">
                {playing ? <PauseIcon size={isFullscreen ? 28 : 24} /> : <PlayIcon size={isFullscreen ? 28 : 24} />}
              </div>
            </div>

            <div
              className="px-3 pb-3 pt-8 bg-gradient-to-t from-black/65 to-transparent sm:px-5 sm:pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="h-1 cursor-pointer rounded-full bg-white/30 hover:h-1.5 transition-all"
                onClick={seek}
                onTouchEnd={seek as React.TouchEventHandler<HTMLDivElement>}
              >
                <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] font-bold text-white/70 sm:text-[11px]">
                <span>{fmtDuration(cur)}</span>
                <span>{fmtDuration(dur || 0)}</span>
              </div>
            </div>
          </div>
        ) : isFullscreen ? (
          <div className="absolute inset-0 z-10 flex flex-col">
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
              <button
                onClick={exitFullscreen}
                className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-black/45 text-white/80 border border-white/15 backdrop-blur-sm active:scale-95"
                aria-label="Exit fullscreen"
              >
                <ExitFullscreenIcon />
              </button>
              {poster && (
                <div className="relative z-10 mb-10 h-56 w-56 overflow-hidden rounded-3xl shadow-2xl ring-2 ring-gold/30">
                  <img src={poster} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <button
                onClick={toggle}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gold text-deep-green shadow-xl active:scale-95 transition"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
              </button>
            </div>
            <div className="flex flex-shrink-0 items-center gap-4 border-t border-white/10 bg-black/60 px-5 py-4 backdrop-blur-sm">
              <button
                onClick={toggle}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gold-light text-gold-light active:scale-95"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              </button>
              <div className="min-w-0 flex-1">
                <div
                  className="h-1 cursor-pointer rounded-full bg-white/20"
                  onClick={seek}
                  onTouchEnd={seek as React.TouchEventHandler<HTMLDivElement>}
                >
                  <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] font-bold text-white/50">
                  <span>{fmtDuration(cur)}</span>
                  <span>{fmtDuration(dur || 0)}</span>
                </div>
              </div>
              <button
                onClick={exitFullscreen}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/70 active:scale-95"
                aria-label="Exit fullscreen"
              >
                <ExitFullscreenIcon />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <button
                onClick={toggle}
                className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-gold-light bg-black/40 text-gold-light backdrop-blur transition hover:scale-105 active:scale-95 shadow-lg"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
            </div>
            <button
              onClick={enterFullscreen}
              className="absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-black/55 text-white/90 border border-white/15 backdrop-blur-sm hover:bg-black/75 active:scale-95 transition"
              aria-label="Fullscreen"
            >
              <EnterFullscreenIcon />
            </button>
            <div className="absolute inset-x-4 bottom-3 z-20">
              <div
                className="h-[4px] cursor-pointer rounded-full bg-white/25 hover:h-[6px] transition-all"
                onClick={seek}
              >
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] font-bold text-[#C7C0A4]">
                <span>{fmtDuration(cur)}</span>
                <span>{fmtDuration(dur || 0)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function EnterFullscreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V4h3" />
      <path d="M21 7V4h-3" />
      <path d="M3 17v3h3" />
      <path d="M21 17v3h-3" />
    </svg>
  );
}
function ExitFullscreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v3H3" />
      <path d="M18 4v3h3" />
      <path d="M6 20v-3H3" />
      <path d="M18 20v-3h3" />
    </svg>
  );
}
