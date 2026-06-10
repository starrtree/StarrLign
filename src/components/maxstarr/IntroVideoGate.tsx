'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const MOBILE_VIDEOS = [
  '/starrLign_loading_screen%28Mobile%29.mp4',
  '/starrLign_loading_screen(Mobile).mp4',
  '/starrLign_loading_screen.mov',
];

const DESKTOP_VIDEOS = [
  '/starrLign_loading_screen%28Desktop%29.mp4',
  '/starrLign_loading_screen(Desktop).mp4',
  '/starrLign_loading_screen.mov',
];

export default function IntroVideoGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
  }, []);

  const sources = useMemo(() => (isDesktop ? DESKTOP_VIDEOS : MOBILE_VIDEOS), [isDesktop]);
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
  }, [isDesktop]);

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
      {!videoFailed && (
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
        </div>
      )}

      <button type="button" onClick={() => setShowIntro(false)} className="absolute bottom-6 right-6 px-3 py-1.5 rounded bg-white text-black text-xs">
        Continue
      </button>
    </div>
  );
}
