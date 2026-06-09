'use client';

import { useEffect, useState } from 'react';

export default function IntroVideoGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowIntro(false), 8000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!showIntro) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden" style={{ zIndex: 999 }}>
      <video
        className="w-full h-full object-cover"
        src="/starrLign_loading_screen.mov"
        muted
        playsInline
        preload="auto"
        onEnded={() => setShowIntro(false)}
        onError={() => setShowIntro(false)}
      />
      <button type="button" onClick={() => setShowIntro(false)} className="absolute bottom-6 right-6 px-3 py-1.5 rounded bg-white text-black text-xs">
        Continue
      </button>
    </div>
  );
}
