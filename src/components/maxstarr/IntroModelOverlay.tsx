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
        right: '4.5vw',
        top: '50%',
        width: 'min(34vw, 480px)',
        height: 'min(34vw, 480px)',
        transform: 'translateY(-50%)',
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
          animation: starrDesktopModelPop 1.45s cubic-bezier(0.17, 1.35, 0.32, 1) 5.45s forwards,
            starrFloat 4.8s ease-in-out 7s infinite;
        }

        .starrlign-intro-model-mobile {
          opacity: 1;
          animation: starrMobileModelEnter 1.15s cubic-bezier(0.17, 1.25, 0.32, 1) forwards,
            starrFloatMobile 4.4s ease-in-out 1.2s infinite;
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
          animation: starrFallbackSpin 6s linear infinite;
        }

        .starrlign-model-light-ring {
          position: absolute;
          inset: 9%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 209, 0, 0.3) 0%, rgba(255, 255, 255, 0.14) 32%, rgba(237, 28, 36, 0.12) 54%, transparent 72%);
          filter: blur(18px);
          animation: starrPulseGlow 2.8s ease-in-out infinite;
          z-index: 1;
        }

        .starrlign-model-shine {
          position: absolute;
          inset: 9%;
          z-index: 5;
          border-radius: 999px;
          overflow: hidden;
          mix-blend-mode: screen;
        }

        .starrlign-model-shine::after {
          content: '';
          position: absolute;
          top: -20%;
          left: -75%;
          width: 36%;
          height: 150%;
          background: linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.65) 48%, rgba(255, 209, 0, 0.22) 58%, transparent 100%);
          transform: rotate(18deg);
          animation: starrModelShine 2.65s ease-in-out infinite;
        }

        .starrlign-model-orbital-line {
          position: absolute;
          inset: 13%;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          z-index: 2;
          mix-blend-mode: screen;
        }

        .starrlign-model-orbital-line-one {
          transform: rotateX(65deg) rotateZ(18deg);
          animation: starrOrbitOne 8s linear infinite;
        }

        .starrlign-model-orbital-line-two {
          transform: rotateX(72deg) rotateZ(-35deg);
          border-color: rgba(255, 209, 0, 0.22);
          animation: starrOrbitTwo 10s linear infinite reverse;
        }

        @keyframes starrDesktopModelPop {
          0% { opacity: 0; transform: translateY(-50%) translateX(120px) scale(0.25) rotate(-34deg); filter: blur(18px) drop-shadow(0 24px 48px rgba(0, 0, 0, 0.4)); }
          56% { opacity: 1; transform: translateY(-50%) translateX(-8px) scale(1.08) rotate(10deg); filter: blur(0) drop-shadow(0 28px 56px rgba(0, 0, 0, 0.48)); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0) scale(1) rotate(0deg); filter: blur(0) drop-shadow(0 24px 48px rgba(0, 0, 0, 0.42)); }
        }

        @keyframes starrMobileModelEnter {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.72) rotate(-16deg); filter: blur(12px) drop-shadow(0 18px 42px rgba(0, 0, 0, 0.4)); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); filter: blur(0) drop-shadow(0 24px 48px rgba(0, 0, 0, 0.42)); }
        }

        @keyframes starrFloat {
          0%, 100% { transform: translateY(-50%) translateX(0) scale(1); }
          50% { transform: translateY(calc(-50% - 12px)) translateX(-3px) scale(1.025); }
        }

        @keyframes starrFloatMobile {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, calc(-50% - 10px)) scale(1.025); }
        }

        @keyframes starrModelShine {
          0% { left: -75%; opacity: 0; }
          18% { opacity: 0.72; }
          48% { opacity: 1; }
          72% { opacity: 0; }
          100% { left: 132%; opacity: 0; }
        }

        @keyframes starrPulseGlow {
          0%, 100% { transform: scale(0.95); opacity: 0.72; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        @keyframes starrOrbitOne {
          0% { transform: rotateX(65deg) rotateZ(18deg); }
          100% { transform: rotateX(65deg) rotateZ(378deg); }
        }

        @keyframes starrOrbitTwo {
          0% { transform: rotateX(72deg) rotateZ(-35deg); }
          100% { transform: rotateX(72deg) rotateZ(325deg); }
        }

        @keyframes starrFallbackSpin {
          0% { transform: rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateY(360deg) rotateZ(360deg); }
        }
      `}</style>
    </div>
  );
}

function createModelViewer() {
  return createElement('model-viewer', {
    src: STARRLIGN_MODEL_URL,
    alt: 'StarrLign app icon 3D model',
    'auto-rotate': true,
    'rotation-per-second': '34deg',
    'interaction-prompt': 'none',
    'disable-pan': true,
    'disable-tap': true,
    'disable-zoom': true,
    'environment-image': 'neutral',
    exposure: '1.18',
    'shadow-intensity': '0.45',
    'camera-orbit': '0deg 68deg 115%',
    'field-of-view': '30deg',
    loading: 'eager',
    reveal: 'auto',
  });
}
