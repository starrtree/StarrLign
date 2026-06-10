'use client';

import { useEffect, useRef, useState } from 'react';

const MOBILE_VIDEO = '/starrLign_loading_screen(Mobile).mp4';
const DESKTOP_VIDEO = '/starrLign_loading_screen(Desktop).mp4';

export default function IntroVideoGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const [videoSrc, setVideoSrc] = useState(MOBILE_VIDEO);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    setVideoSrc(isDesktop ? DESKTOP_VIDEO : MOBILE_VIDEO);
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const timeout = window.setTimeout(() => setShowIntro(false), 8000);
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('autoplay', '');
      void video.play().catch(() => undefined);
    }
    return () => window.clearTimeout(timeout);
  }, [showIntro, videoSrc]);

  if (!showIntro) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden" style={{ zIndex: 999 }}>
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
        onEnded={() => setShowIntro(false)}
        onError={() => setShowIntro(false)}
      />
      <button type="button" onClick={() => setShowIntro(false)} className="absolute bottom-6 right-6 px-3 py-1.5 rounded bg-white text-black text-xs">
        Continue
      </button>
    </div>
  );
}
