'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import IntroModelOverlay from './IntroModelOverlay';
import { playAppSoundWhenReady, preloadAppSounds } from '@/lib/sound';
import { useStore } from '@/lib/store';

type VideoManifestItem = {
  name: string;
  url: string;
};

const INTRO_LOADING_AUDIO_SRC = '/api/sounds/by-name/introLoading';

const LEGACY_MOBILE_VIDEOS = [
  '/videos/starrLign_loading_screen_Mobile.mp4',
  '/videos/starrLign_loading_screen(Mobile).mp4',
  '/starrLign_loading_screen_Mobile.mp4',
  '/starrLign_loading_screen.mov',
];

const LEGACY_DESKTOP_VIDEOS = [
  '/videos/starrLign_loading_screen_Desktop.mp4',
  '/videos/starrLign_loading_screen(Desktop).mp4',
  '/starrLign_loading_screen_Desktop.mp4',
  '/starrLign_loading_screen.mov',
];

const MOBILE_HINTS = ['mobile', 'phone', 'portrait', 'vertical', '9x16'];
const DESKTOP_HINTS = ['desktop', 'wide', 'landscape', 'horizontal', '16x9'];

function nameIncludesAny(name: string, hints: string[]) {
  const normalized = name.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
}

function pickResponsiveVideos(videos: VideoManifestItem[]) {
  const mobileMatch = videos.find((video) => nameIncludesAny(video.name, MOBILE_HINTS));
  const desktopMatch = videos.find((video) => nameIncludesAny(video.name, DESKTOP_HINTS));

  return {
    mobile: mobileMatch?.url || videos[0]?.url || null,
    desktop: desktopMatch?.url || videos.find((video) => video.url !== mobileMatch?.url)?.url || videos[0]?.url || null,
    names: videos.map((video) => video.name),
  };
}

export default function IntroVideoGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [introStarted, setIntroStarted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [manifestVideos, setManifestVideos] = useState<VideoManifestItem[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const introStartedRef = useRef(false);
  const introSoundAttemptedRef = useRef(false);
  const introSoundPlayedRef = useRef(false);
  const appOpenFallbackRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const soundEnabled = useStore((state) => state.soundEnabled);

  const tryPlayIntroAudioElement = useCallback(() => {
    if (!soundEnabled || introSoundPlayedRef.current || !audioRef.current) return false;

    try {
      const audio = audioRef.current;
      audio.volume = 0.72;
      audio.currentTime = 0;
      const playPromise = audio.play();
      introSoundAttemptedRef.current = true;
      void playPromise
        .then(() => {
          introSoundPlayedRef.current = true;
        })
        .catch(() => {
          introSoundPlayedRef.current = false;
        });
      return true;
    } catch {
      introSoundAttemptedRef.current = true;
      return false;
    }
  }, [soundEnabled]);

  const tryFallbackIntroSound = useCallback(async () => {
    if (!soundEnabled || introSoundPlayedRef.current) return false;
    const played = await playAppSoundWhenReady('introLoading', true);
    if (played) introSoundPlayedRef.current = true;
    return played;
  }, [soundEnabled]);

  const finishIntro = useCallback(() => {
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    const shouldFallbackAfterOpen = !introSoundPlayedRef.current && !appOpenFallbackRef.current && soundEnabled;

    if (introSoundPlayedRef.current && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setShowIntro(false);

    if (shouldFallbackAfterOpen) {
      appOpenFallbackRef.current = true;
      void tryFallbackIntroSound();
    }
  }, [soundEnabled, tryFallbackIntroSound]);

  const beginIntro = useCallback(() => {
    if (introStartedRef.current) return;
    introStartedRef.current = true;
    setIntroStarted(true);
    setVideoFailed(false);

    const audioPlayStarted = tryPlayIntroAudioElement();
    if (!audioPlayStarted) void tryFallbackIntroSound();

    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.currentTime = 0;
      void video.play().catch(() => {
        setVideoFailed(true);
        if (!introSoundAttemptedRef.current) void tryFallbackIntroSound();
      });
    }

    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = window.setTimeout(() => finishIntro(), 12500);
  }, [finishIntro, tryFallbackIntroSound, tryPlayIntroAudioElement]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateDevice = () => setIsDesktop(mediaQuery.matches);
    updateDevice();
    mediaQuery.addEventListener('change', updateDevice);
    return () => mediaQuery.removeEventListener('change', updateDevice);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVideoManifest() {
      try {
        const response = await fetch('/api/videos', { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled && Array.isArray(data.videos)) {
          setManifestVideos(data.videos);
        }
      } catch {
        if (!cancelled) setManifestVideos([]);
      }
    }

    loadVideoManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    preloadAppSounds();
    audioRef.current?.load();
  }, []);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    };
  }, []);

  const detectedVideos = useMemo(() => pickResponsiveVideos(manifestVideos), [manifestVideos]);

  const sources = useMemo(() => {
    const detected = isDesktop ? detectedVideos.desktop : detectedVideos.mobile;
    const fallbacks = isDesktop ? LEGACY_DESKTOP_VIDEOS : LEGACY_MOBILE_VIDEOS;
    return Array.from(new Set([detected, ...fallbacks].filter(Boolean) as string[]));
  }, [detectedVideos.desktop, detectedVideos.mobile, isDesktop]);

  const videoSrc = sources[sourceIndex] || sources[0];

  useEffect(() => {
    setSourceIndex(0);
    setVideoFailed(false);
  }, [isDesktop, manifestVideos.length]);

  const handleVideoError = () => {
    const nextIndex = sourceIndex + 1;
    if (nextIndex < sources.length) {
      setSourceIndex(nextIndex);
      return;
    }
    setVideoFailed(true);
    if (!introSoundAttemptedRef.current) void tryFallbackIntroSound();
  };

  const handleVideoPlaying = () => {
    if (!introStartedRef.current) return;
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    finishTimerRef.current = window.setTimeout(() => finishIntro(), 12000);
  };

  if (!showIntro) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden" style={{ zIndex: 999 }}>
      <audio ref={audioRef} src={INTRO_LOADING_AUDIO_SRC} preload="auto" playsInline />

      {!videoFailed && videoSrc && (
        <video
          ref={videoRef}
          key={videoSrc}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${introStarted ? 'opacity-100' : 'opacity-0'}`}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          onPlaying={handleVideoPlaying}
          onPlay={handleVideoPlaying}
          onEnded={finishIntro}
          onError={handleVideoError}
        />
      )}

      {introStarted && <IntroModelOverlay isDesktop={isDesktop} />}

      {!introStarted && (
        <button
          type="button"
          onPointerDown={beginIntro}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') beginIntro();
          }}
          className="absolute inset-0 z-[10] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,209,0,0.20)_0%,rgba(0,82,180,0.20)_34%,rgba(0,0,0,0.96)_72%)] text-center px-6 cursor-pointer"
          aria-label="Tap to start StarrLign intro"
        >
          <div className="relative w-[min(58vw,260px)] h-[min(58vw,260px)] mb-6 rounded-full border border-white/15 bg-black/30 shadow-[0_0_60px_rgba(255,209,0,0.25)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-5 rounded-full bg-[radial-gradient(circle,rgba(255,209,0,0.45),rgba(237,28,36,0.12)_42%,transparent_72%)] blur-xl animate-pulse" />
            <div className="relative text-[78px] md:text-[108px] leading-none text-[var(--brand-yellow)] drop-shadow-[0_0_22px_rgba(255,209,0,0.85)]">★</div>
          </div>
          <div className="text-[42px] md:text-[72px] leading-none tracking-[4px] text-[var(--brand-yellow)] drop-shadow-[0_0_20px_rgba(255,209,0,0.5)]" style={{ fontFamily: 'var(--font-display)' }}>
            STARRLIGN
          </div>
          <div className="mt-3 text-xs md:text-sm uppercase tracking-[3px] text-white/75" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            Tap to align
          </div>
          <div className="mt-6 px-5 py-2.5 rounded-full border-[2px] border-black bg-[var(--brand-yellow)] text-black text-xs font-black tracking-[2px] shadow-[4px_4px_0_black]" style={{ fontFamily: 'var(--font-space-mono), monospace' }}>
            START INTRO + SOUND
          </div>
        </button>
      )}

      {introStarted && videoFailed && (
        <div className="px-8 text-center text-white relative z-[7]">
          <div className="text-4xl font-black tracking-[4px] text-[var(--brand-yellow)]">STARRLIGN</div>
          <div className="mt-3 text-xs uppercase tracking-[2px] text-white/70">Video blocked. Continue to enter.</div>
        </div>
      )}

      {introStarted && (
        <button type="button" onClick={finishIntro} className="absolute bottom-6 right-6 z-[8] px-3 py-1.5 rounded bg-white text-black text-xs">
          Continue
        </button>
      )}
    </div>
  );
}
