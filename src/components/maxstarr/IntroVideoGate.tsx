'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type VideoManifestItem = {
  name: string;
  url: string;
};

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
          if (process.env.NODE_ENV !== 'production') {
            console.info('[StarrLign intro videos]', data.videos.map((video: VideoManifestItem) => video.name));
          }
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
  };

  const handleVideoPlaying = () => {
    window.setTimeout(() => setShowIntro(false), 12000);
  };

  if (!showIntro) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden" style={{ zIndex: 999 }}>
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
          onEnded={() => setShowIntro(false)}
          onError={handleVideoError}
        />
      )}

      {videoFailed && (
        <div className="px-8 text-center text-white">
          <div className="text-4xl font-black tracking-[4px] text-[var(--brand-yellow)]">STARRLIGN</div>
          <div className="mt-3 text-xs uppercase tracking-[2px] text-white/70">Tap continue to enter</div>
          {detectedVideos.names.length > 0 && (
            <div className="mt-3 text-[10px] text-white/40">
              Found videos: {detectedVideos.names.join(', ')}
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={() => setShowIntro(false)} className="absolute bottom-6 right-6 px-3 py-1.5 rounded bg-white text-black text-xs">
        Continue
      </button>
    </div>
  );
}
