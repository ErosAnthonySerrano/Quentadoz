import React from 'react'

const WAVE_PATH = 'M 0,108 C 180,108 360,72 432,76 C 504,80 680,118 792,120 C 900,122 1080,60 1181,68 C 1280,76 1380,88 1440,92'

const WAVE_PATH_A = 'M 0,120 C 180,120 360,84 432,88 C 504,92 680,130 792,132 C 900,134 1080,72 1181,80 C 1280,88 1380,100 1440,104'

const WAVE_PATH_C = 'M 0,104 C 180,104 360,70 432,73 C 504,76 680,112 792,114 C 900,116 1080,57 1181,64 C 1280,71 1380,83 1440,87'

function WaveBackgroundDark() {
  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 1440 160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block h-[160px] w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wg-dark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="8%" stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="70%" stopColor="#8b5cf6" stopOpacity="1" />
            <stop offset="90%" stopColor="#ec4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wg-hi-dark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0" />
            <stop offset="10%" stopColor="#a5f3fc" stopOpacity="0.9" />
            <stop offset="42%" stopColor="#bfdbfe" stopOpacity="1" />
            <stop offset="72%" stopColor="#ddd6fe" stopOpacity="0.9" />
            <stop offset="92%" stopColor="#fbcfe8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0" />
          </linearGradient>
          <filter id="wave-glow-a-dark" x="-10%" y="-500%" width="120%" height="1100%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="wave-glow-b-dark" x="-10%" y="-300%" width="120%" height="700%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="wave-glow-c-dark" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <path
          d={WAVE_PATH_A}
          fill="none"
          stroke="url(#wg-dark)"
          strokeWidth="32"
          strokeLinecap="round"
          filter="url(#wave-glow-a-dark)"
          opacity="0.18"
        />
        <path
          d={WAVE_PATH}
          fill="none"
          stroke="url(#wg-dark)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#wave-glow-b-dark)"
          opacity="0.45"
        />
        <path
          d={WAVE_PATH}
          fill="none"
          stroke="url(#wg-dark)"
          strokeWidth="1.8"
          strokeLinecap="round"
          filter="url(#wave-glow-c-dark)"
          opacity="0.9"
        />
        <path
          d={WAVE_PATH_C}
          fill="none"
          stroke="url(#wg-hi-dark)"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="1"
        />
      </svg>
    </div>
  )
}

function WaveBackgroundLight() {
  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none">
      <svg
        viewBox="0 0 1440 160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="block h-[160px] w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wg-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0" />
            <stop offset="8%" stopColor="#dbeafe" stopOpacity="0.42" />
            <stop offset="40%" stopColor="#bfdbfe" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#ddd6fe" stopOpacity="0.28" />
            <stop offset="90%" stopColor="#fbcfe8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wg-hi-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f8fafc" stopOpacity="0" />
            <stop offset="10%" stopColor="#e0f2fe" stopOpacity="0.55" />
            <stop offset="42%" stopColor="#dbeafe" stopOpacity="0.7" />
            <stop offset="72%" stopColor="#ede9fe" stopOpacity="0.5" />
            <stop offset="92%" stopColor="#fce7f3" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fce7f3" stopOpacity="0" />
          </linearGradient>
          <filter id="wave-glow-a-light" x="-10%" y="-500%" width="120%" height="1100%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="wave-glow-b-light" x="-10%" y="-300%" width="120%" height="700%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="wave-glow-c-light" x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="0.9" />
          </filter>
        </defs>

        <path
          d={WAVE_PATH_A}
          fill="none"
          stroke="url(#wg-light)"
          strokeWidth="24"
          strokeLinecap="round"
          filter="url(#wave-glow-a-light)"
          opacity="0.08"
        />
        <path
          d={WAVE_PATH}
          fill="none"
          stroke="url(#wg-light)"
          strokeWidth="9"
          strokeLinecap="round"
          filter="url(#wave-glow-b-light)"
          opacity="0.14"
        />
        <path
          d={WAVE_PATH}
          fill="none"
          stroke="url(#wg-light)"
          strokeWidth="1.25"
          strokeLinecap="round"
          filter="url(#wave-glow-c-light)"
          opacity="0.42"
        />
        <path
          d={WAVE_PATH_C}
          fill="none"
          stroke="url(#wg-hi-light)"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.22"
        />
      </svg>
    </div>
  )
}

export function PageBackground() {
  return (
    <div aria-hidden="true" className="page-background pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 theme-light-only"
        style={{
          background:
            'radial-gradient(600px 380px at 15% 10%, rgba(123, 167, 255, 0.14), transparent 60%), radial-gradient(520px 340px at 82% 12%, rgba(166, 120, 255, 0.09), transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,248,255,0.98) 34%, rgba(243,247,255,1) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40 theme-light-only"
        style={{
          background:
            'radial-gradient(220px 220px at 50% 0%, rgba(80, 194, 255, 0.1), transparent 68%), radial-gradient(160px 160px at 7% 7%, rgba(94, 135, 255, 0.08), transparent 72%)',
        }}
      />
      <div
        className="absolute inset-0 theme-dark-only"
        style={{
          background:
            'radial-gradient(720px 420px at 15% 10%, rgba(33, 72, 181, 0.35), transparent 58%), radial-gradient(600px 360px at 84% 12%, rgba(123, 67, 255, 0.22), transparent 60%), linear-gradient(180deg, rgba(7, 10, 33, 0.94), rgba(6, 8, 25, 0.98) 34%, rgba(5, 8, 25, 1) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-60 theme-dark-only"
        style={{
          background:
            'radial-gradient(240px 240px at 50% 0%, rgba(80, 194, 255, 0.12), transparent 68%), radial-gradient(160px 160px at 7% 7%, rgba(126, 67, 255, 0.1), transparent 72%)',
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[160px]"
        style={{
          maskImage: 'linear-gradient(to top, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent)',
        }}
      >
        <WaveBackgroundLight />
        <WaveBackgroundDark />
      </div>
    </div>
  )
}
