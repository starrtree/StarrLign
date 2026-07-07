'use client';

import { CSSProperties, createElement, useEffect, useState } from 'react';

const STARRLIGN_MODEL_URL = 'https://res.cloudinary.com/r9c7da2l/image/upload/v1783385196/StarrLign_compressed_under_10mb_z5abhn.glb';
const MODEL_VIEWER_SRC = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';

let modelViewerScriptLoading: Promise<void> | null = null;

function loadModelViewer() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.customElements.get('model-viewer')) return Promise.resolve();
  if (modelViewerScriptLoading) return modelViewerScriptLoading;

  modelViewerScriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${MODEL_VIEWER_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('model-viewer failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('model-viewer failed to load'));
    document.head.appendChild(script);
  });

  return modelViewerScriptLoading;
}

type IntroModelOverlayProps = {
  isDesktop: boolean;
};

export default function IntroModelOverlay({ isDesktop }: IntroModelOverlayProps) {
  const [modelViewerReady, setModelViewerReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadModelViewer()
      .then(() => {
        if (!cancelled) setModelViewerReady(true);
      })
      .catch(() => {
        if (!cancelled) setModelViewerReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const wrapperStyle: CSSProperties = isDesktop
    ? {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 'min(32vw, 460px)',
        height: 'min(32vw, 460px)',
        transform: 'translate(-50%, -50%)',
      }
    : {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 'min(78vw, 380px)',
        height: 'min(78vw, 380px)',
        transform: 'translate(-50%, -50%)',
      };

  return (
    <div
      className={isDesktop ? 'starrlign-intro-model starrlign-intro-model-desktop' : 'starrlign-intro-model starrlign-intro-model-mobile'}
      style={wrapperStyle}
      aria-hidden="true"
    >
      <div className="starrlign-model-light-ring" />
      <div className="starrlign-model-shine" />
      <div className="starrlign-model-orbital-line starrlign-model-orbital-line-one" />
      <div className="starrlign-model-orbital-line starrlign-model-orbital-line-two" />

      {modelViewerReady ? (
        <div className="starrlign-model-viewer-shell">
          {createModelViewer()}
        </div>
      ) : (
        <div className="starrlign-model-fallback">★</div>
      )}

      <style jsx>{`
        .starrlign-intro-model {
          pointer-events: none;
          z-index: 6;
          filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.42));
        }

        .starrlign-intro-model-desktop {
          opacity: 0;
          animation: starrDesktopModelPop 1.35s cubic-bezier(0.17, 1.35, 0.32, 1) 5.45s forwards,
            starrCenterHover 4.8s ease-in-out 6.85s infinite;
        }

        .starrlign-intro-model-mobile {
          opacity: 1;
          animation: starrMobileModelEnter 1.05s cubic-bezier(0.17, 1.25, 0.32, 1) forwards,
            starrMobileHover 4.4s ease-in-out 1.15s infinite;
        }

        .starrlign-model-viewer-shell,
        .starrlign-model-fallback {
          position: absolute;
          inset: 0;
          z-index: 3;
        }

        .starrlign-model-viewer-shell :global(model-viewer) {
          width: 100%;
          height: 100%;
          --poster-color: transparent;
          background: transparent;
        }

        .starrlign-model-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-yellow);
          font-size: clamp(92px, 20vw, 180px);
          text-shadow: 0 0 24px rgba(255, 209, 0, 0.75), 0 0 70px rgba(255, 255, 255, 0.45);
          animation: starrFallbackFloat 3.8s ease-in-out infinite;
        }

        .starrlign-model-light-ring {
          position: absolute;
          inset: 8%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 209, 0, 0.3) 0%, rgba(255, 255, 255, 0.14) 32%, rgba(237, 28, 36, 0.12) 54%, transparent 72%);
          filter: blur(18px);
          animation: starrPulseGlow 2.8s ease-in-out infinite;
          z-index: 1;
        }

        .starrlign-model-shine {
          position: absolute;
          inset: 0;
          z-index: 5;
          border-radius: 999px;
          overflow: hidden;
          mix-blend-mode: screen;
          pointer-events: none;
          -webkit-mask-image: radial-gradient(circle at center, #000 0%, #000 48%, rgba(0, 0, 0, 0.45) 62%, transparent 78%);
          mask-image: radial-gradient(circle at center, #000 0%, #000 48%, rgba(0, 0, 0, 0.45) 62%, transparent 78%);
        }

        .starrlign-model-shine::after {
          content: '';
          position: absolute;
          top: -26%;
          left: -70%;
          width: 28%;
          height: 156%;
          background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.02) 22%, rgba(255, 255, 255, 0.5) 48%, rgba(255, 209, 0, 0.2) 60%, transparent 100%);
          filter: blur(9px);
          transform: rotate(18deg);
          animation: starrModelShine 3.15s ease-in-out infinite;
        }

        .starrlign-model-orbital-line {
          position: absolute;
          inset: 15%;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          z-index: 2;
          mix-blend-mode: screen;
          opacity: 0.55;
        }

        .starrlign-model-orbital-line-one {
          transform: rotateX(65deg) rotateZ(18deg);
          animation: starrOrbitBreathOne 4.8s ease-in-out infinite;
        }

        .starrlign-model-orbital-line-two {
          transform: rotateX(72deg) rotateZ(-35deg);
          border-color: rgba(255, 209, 0, 0.15);
          animation: starrOrbitBreathTwo 5.4s ease-in-out infinite;
        }

        @keyframes starrDesktopModelPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.28) rotate(-20deg); filter: blur(18px) drop-shadow(0 24px 48px rgba(0, 0, 0, 0.4)); }
          58% { opacity: 1; transform: translate(-50%, -50%) scale(1.08) rotate(7deg); filter: blur(0) drop-shadow(0 28px 56px rgba(0, 0, 0, 0.48)); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); filter: blur(0) drop-shadow(0 24px 48px rgba(0, 0, 0, 0.42)); }
        }

        @keyframes starrMobileModelEnter {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.72) rotate(-8deg); filter: blur(12px) drop-shadow(0 18px 42px rgba(0, 0, 0, 0.4)); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); filter: blur(0) drop-shadow(0 24px 48px rgba(0, 0, 0, 0.42)); }
        }

        @keyframes starrCenterHover {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          25% { transform: translate(calc(-50% + 3px), calc(-50% - 9px)) scale(1.018) rotate(1.1deg); }
          50% { transform: translate(calc(-50% - 2px), calc(-50% - 13px)) scale(1.025) rotate(-0.8deg); }
          75% { transform: translate(calc(-50% - 4px), calc(-50% - 6px)) scale(1.012) rotate(0.7deg); }
        }

        @keyframes starrMobileHover {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, calc(-50% - 10px)) scale(1.018) rotate(0.8deg); }
        }

        @keyframes starrModelShine {
          0% { left: -70%; opacity: 0; }
          22% { opacity: 0.55; }
          48% { opacity: 0.82; }
          76% { opacity: 0; }
          100% { left: 134%; opacity: 0; }
        }

        @keyframes starrPulseGlow {
          0%, 100% { transform: scale(0.95); opacity: 0.68; }
          50% { transform: scale(1.08); opacity: 0.92; }
        }

        @keyframes starrOrbitBreathOne {
          0%, 100% { transform: rotateX(65deg) rotateZ(18deg) scale(0.98); opacity: 0.42; }
          50% { transform: rotateX(65deg) rotateZ(24deg) scale(1.04); opacity: 0.68; }
        }

        @keyframes starrOrbitBreathTwo {
          0%, 100% { transform: rotateX(72deg) rotateZ(-35deg) scale(1); opacity: 0.35; }
          50% { transform: rotateX(72deg) rotateZ(-29deg) scale(1.06); opacity: 0.58; }
        }

        @keyframes starrFallbackFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
        }
      `}</style>
    </div>
  );
}

function createModelViewer() {
  return createElement('model-viewer', {
    src: STARRLIGN_MODEL_URL,
    alt: 'StarrLign app icon 3D model',
    'interaction-prompt': 'none',
    'disable-pan': true,
    'disable-tap': true,
    'disable-zoom': true,
    'environment-image': 'neutral',
    exposure: '1.22',
    'shadow-intensity': '0.42',
    orientation: '0deg 180deg 0deg',
    'camera-orbit': '0deg 66deg 112%',
    'field-of-view': '29deg',
    loading: 'eager',
    reveal: 'auto',
  });
}
