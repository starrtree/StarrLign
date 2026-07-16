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
  const [isDesktop, setIsDesktop] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [manifestVideos, setManifestVideos] = useState<VideoManifestItem[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const introSoundAttemptedRef = useRef(false);
  const introSoundPlayedRef = useRef(false);
  const appOpenFallbackRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const soundEnabled = useStore((state) => state.soundEnabled);

  const tryPlayIntroAudioElement = useCallback(async () => {
    if (!soundEnabled || introSoundPlayedRef.current || !audioRef.current) return false;

    try {
      const audio = audioRef.current;
      audio.volume = 0.72;
      audio.currentTime = 0;
      await audio.play();
      introSoundAttemptedRef.current = true;
      introSoundPlayedRef.current = true;
      return true;
    } catch {
      introSoundAttemptedRef.current = true;
      return false;
    }
  }, [soundEnabled]);

  const tryPlayIntroSound = useCallback(async () => {
    if (!soundEnabled || introSoundPlayedRef.current) return false;

    const htmlAudioPlayed = await tryPlayIntroAudioElement();
    if (htmlAudioPlayed) return true;

    const played = await playAppSoundWhenReady('introLoading', true);
    if (played) introSoundPlayedRef.current = true;
    return played;
  }, [soundEnabled, tryPlayIntroAudioElement]);

  const finishIntro = useCallback(() => {
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    setShowIntro(false);
    if (!introSoundPlayedRef.current && !appOpenFallbackRef.current && soundEnabled) {
      appOpenFallbackRef.current = true;
      void tryPlayIntroSound();
    }
  }, [soundEnabled, tryPlayIntroSound]);

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

    const retryAfterGesture = () => {
      if (introSoundPlayedRef.current) return;
      void tryPlayIntroSound();
    };

    window.addEventListener('pointerdown', retryAfterGesture, { once: true, passive: true });
    window.addEventListener('touchstart', retryAfterGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', retryAfterGesture);
      window.removeEventListener('touchstart', retryAfterGesture);
    };
  }, [tryPlayIntroSound]);

  useEffect(() => {
    if (!showIntro) return;
    finishTimerRef.current = window.setTimeout(() => finishIntro(), 12500);
    return () => {
      if (finishTimerRef.current) {
        window.clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    };
  }, [finishIntro, showIntro]);

  const detectedVideos = useMemo(() => pickResponsiveVideos(manifestVideos), [manifestVideos]);

  const sources = useMemo(() => {
    const detected = isDesktop ? detectedVideos.desktop : detectedVideos.mobile;
    const fallbacks = isDesktop ? LEGACY_DESKTOP_VIDEOS : LEGACY_MOBILE_VIDEOS;
    return Array.from(new Set([detected, ...fallbacks].filter(Boolean) as string[]));
  }, [detectedVideos.desktop, detectedVideos.mobile, isDesktop]);

  const videoSrc = sources[sourceIndex] || sources[0];

  useEffect(() => {
    if (!showIntro || videoFailed) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    video.load();
    void video.play().catch(() => undefined);
  }, [showIntro, videoSrc, videoFailed]);

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
    if (!introSoundAttemptedRef.current) void tryPlayIntroSound();
  };

  const handleVideoPlaying = () => {
    if (!introSoundAttemptedRef.current) void tryPlayIntroSound();
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
          className="w-full h-full object-cover"
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          onCanPlay={() => {
            void videoRef.current?.play().catch(() => undefined);
          }}
          onPlaying={handleVideoPlaying}
          onPlay={handleVideoPlaying}
          onEnded={finishIntro}
          onError={handleVideoError}
        />
      )}

      <IntroModelOverlay isDesktop={isDesktop} />

      {videoFailed && (
        <div className="px-8 text-center text-white relative z-[7]">
          <div className="text-4xl font-black tracking-[4px] text-[var(--brand-yellow)]">STARRLIGN</div>
          <div className="mt-3 text-xs uppercase tracking-[2px] text-white/70">Tap continue to enter</div>
        </div>
      )}

      <button type="button" onClick={finishIntro} className="absolute bottom-6 right-6 z-[8] px-3 py-1.5 rounded bg-white text-black text-xs">
        Continue
      </button>
    </div>
  );
}
