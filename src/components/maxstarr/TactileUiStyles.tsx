'use client';

export default function TactileUiStyles() {
  return (
    <style jsx global>{`
      :root {
        --starr-tactile-ring: 0 0 0 3px rgba(255, 209, 0, 0.72), 0 0 0 6px rgba(0, 82, 180, 0.28);
      }

      button,
      a,
      [role='button'],
      .cursor-pointer,
      .task-card,
      .document-card,
      .project-item,
      .sidebar-item {
        touch-action: manipulation;
        -webkit-tap-highlight-color: rgba(255, 209, 0, 0.28);
        transition-property: transform, box-shadow, filter, background-color, border-color, opacity;
        transition-duration: 140ms;
        transition-timing-function: var(--ease-spring);
      }

      button:focus-visible,
      a:focus-visible,
      [role='button']:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible,
      [contenteditable='true']:focus-visible {
        outline: none !important;
        box-shadow: var(--starr-tactile-ring) !important;
      }

      button:active,
      a:active,
      [role='button']:active,
      .cursor-pointer:active,
      .task-card:active,
      .document-card:active,
      .project-item:active,
      .sidebar-item:active,
      .starr-pressed {
        transform: translate(1px, 1px) scale(0.985) !important;
        filter: saturate(1.08) contrast(1.03);
      }

      .starr-pressed {
        position: relative;
        overflow: hidden;
      }

      .starr-pressed::after {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: inherit;
        border: 2px solid rgba(255, 209, 0, 0.72);
        box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.18), 0 0 18px rgba(255, 209, 0, 0.28);
        pointer-events: none;
        animation: starrTactilePulse 260ms ease-out forwards;
      }

      .yellow-card-contrast,
      .yellow-card-contrast :is(h1, h2, h3, h4, p, span, div, button, label, small) {
        text-shadow: none !important;
      }

      .yellow-card-contrast [class*='drop-shadow'] {
        filter: none !important;
      }

      .yellow-card-contrast:hover,
      .yellow-card-contrast:hover :is(h1, h2, h3, h4, p, span, div, button, label, small) {
        text-shadow: none !important;
        font-weight: 800;
        letter-spacing: 0.01em;
      }

      .yellow-card-contrast:hover [class*='drop-shadow'] {
        filter: none !important;
      }

      .yellow-card-contrast:hover :is(svg, path) {
        filter: none;
      }

      input:focus,
      textarea:focus,
      select:focus,
      [contenteditable='true']:focus {
        background-image: linear-gradient(180deg, rgba(255, 209, 0, 0.06), rgba(0, 82, 180, 0.035));
      }

      .task-card,
      .document-card,
      .project-item,
      .tactile-card {
        will-change: transform, box-shadow;
      }

      @media (hover: hover) {
        button:hover,
        a:hover,
        [role='button']:hover,
        .cursor-pointer:hover {
          filter: saturate(1.05);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        button,
        a,
        [role='button'],
        .cursor-pointer,
        .task-card,
        .document-card,
        .project-item,
        .sidebar-item {
          transition-duration: 1ms;
        }

        .starr-pressed::after {
          animation: none;
          opacity: 0;
        }
      }

      @keyframes starrTactilePulse {
        0% {
          opacity: 0.82;
          transform: scale(0.96);
        }
        100% {
          opacity: 0;
          transform: scale(1.08);
        }
      }
    `}</style>
  );
}
