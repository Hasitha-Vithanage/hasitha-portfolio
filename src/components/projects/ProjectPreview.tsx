import type { ReactElement } from 'react'
import type { PreviewKind, Screenshot } from '../../data/projects'

/**
 * Original illustrative compositions used until real screenshots are supplied.
 * They are deliberately abstract and labelled as concept visuals, so they are
 * never mistaken for screenshots of the finished software.
 */

function GymComposition() {
  const days = Array.from({ length: 7 }, (_, i) => i)
  const slots = Array.from({ length: 5 }, (_, i) => i)
  const booked = new Set(['0-1', '1-3', '2-0', '2-2', '3-1', '4-4', '5-2', '6-0', '3-3', '1-0'])
  return (
    <svg viewBox="0 0 480 300" className="size-full" role="presentation">
      {/* Sidebar of member rows */}
      <rect x="24" y="28" width="118" height="244" rx="10" fill="#171D26" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`translate(38 ${48 + i * 36})`}>
          <circle cx="9" cy="9" r="9" fill={i === 1 ? '#B6FF4A' : '#2A323E'} />
          <rect x="26" y="3" width={60 - (i % 3) * 12} height="5" rx="2.5" fill="#3A4452" />
          <rect x="26" y="12" width={38 + (i % 2) * 14} height="4" rx="2" fill="#262E39" />
        </g>
      ))}
      {/* Weekly class schedule */}
      <rect x="156" y="28" width="300" height="244" rx="10" fill="#11151C" stroke="#232B36" />
      {days.map((d) => (
        <rect key={d} x={172 + d * 40} y="44" width="28" height="5" rx="2.5" fill="#3A4452" />
      ))}
      {days.map((d) =>
        slots.map((s) => {
          const on = booked.has(`${d}-${s}`)
          return (
            <rect
              key={`${d}-${s}`}
              x={168 + d * 40}
              y={62 + s * 40}
              width="36"
              height="32"
              rx="6"
              fill={on ? (d === 2 && s === 2 ? '#B6FF4A' : '#2A3340') : 'transparent'}
              stroke={on ? 'none' : '#1E2530'}
            />
          )
        }),
      )}
    </svg>
  )
}

function NexusComposition() {
  return (
    <svg viewBox="0 0 480 300" className="size-full" role="presentation">
      {/* Terminal window */}
      <rect x="24" y="28" width="432" height="244" rx="10" fill="#11151C" stroke="#232B36" />
      <path d="M24 52H456" stroke="#232B36" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={40 + i * 14} cy="40" r="4" fill={i === 0 ? '#B6FF4A' : '#2A323E'} />
      ))}
      {/* Task queue */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(40 ${74 + i * 34})`}>
          <rect width="10" height="10" rx="2" fill={i === 0 ? '#B6FF4A' : 'none'} stroke={i === 0 ? 'none' : '#3A4452'} />
          <rect x="20" y="2" width={78 - (i % 3) * 14} height="6" rx="3" fill={i === 0 ? '#9CA3AF' : '#2A3340'} />
        </g>
      ))}
      {/* Large clock, as segment blocks */}
      {[0, 1, 2, 3].map((d) => (
        <rect key={d} x={186 + d * 52 + (d > 1 ? 18 : 0)} y="84" width="40" height="64" rx="6" fill="#202833" />
      ))}
      <circle cx="294" cy="104" r="3.5" fill="#B6FF4A" />
      <circle cx="294" cy="128" r="3.5" fill="#B6FF4A" />
      {/* Focus session progress */}
      <rect x="186" y="170" width="242" height="6" rx="3" fill="#202833" />
      <rect x="186" y="170" width="150" height="6" rx="3" fill="#B6FF4A" />
      {/* Weather and holiday panels */}
      <rect x="186" y="196" width="114" height="56" rx="8" fill="#171D26" />
      <rect x="314" y="196" width="114" height="56" rx="8" fill="#171D26" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={324 + i * 10} y={i === 6 ? 222 : 230} width="6" height={i === 6 ? 16 : 8} rx="1.5" fill={i === 6 ? '#B6FF4A' : '#2A3340'} />
      ))}
      <circle cx="210" cy="224" r="10" fill="none" stroke="#9CA3AF" strokeWidth="2" />
      <rect x="230" y="216" width="52" height="6" rx="3" fill="#3A4452" />
      <rect x="230" y="228" width="34" height="5" rx="2.5" fill="#262E39" />
    </svg>
  )
}

function PortfolioComposition() {
  return (
    <svg viewBox="0 0 480 300" className="size-full" role="presentation">
      <defs>
        <radialGradient id="chrome" cx="0.36" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.12" stopColor="#D9DEE5" />
          <stop offset="0.4" stopColor="#6E7785" />
          <stop offset="0.72" stopColor="#1C2129" />
          <stop offset="1" stopColor="#0B0E12" />
        </radialGradient>
        <radialGradient id="rim" cx="0.82" cy="0.78" r="0.5">
          <stop offset="0" stopColor="#B6FF4A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#B6FF4A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="240" cy="150" rx="190" ry="44" fill="none" stroke="#2A3340" transform="rotate(-12 240 150)" />
      <ellipse cx="240" cy="150" rx="222" ry="60" fill="none" stroke="#B6FF4A" strokeOpacity="0.6" transform="rotate(14 240 150)" />
      <circle cx="240" cy="150" r="78" fill="url(#chrome)" />
      <circle cx="240" cy="150" r="78" fill="url(#rim)" />
      <ellipse cx="240" cy="150" rx="78" ry="6" fill="none" stroke="#B6FF4A" strokeWidth="1.5" />
      {[
        [70, 92],
        [408, 214],
        [118, 236],
        [380, 70],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6}l6 6-6 6-6-6z`} fill={i === 1 ? '#B6FF4A' : '#9CA3AF'} />
      ))}
    </svg>
  )
}

const compositions: Record<PreviewKind, () => ReactElement> = {
  gym: GymComposition,
  nexus: NexusComposition,
  portfolio: PortfolioComposition,
}

interface ProjectPreviewProps {
  kind: PreviewKind
  /** A real screenshot; replaces the concept visual when present. */
  image?: Screenshot
  className?: string
}

export function ProjectPreview({ kind, image, className = '' }: ProjectPreviewProps) {
  if (image?.src) {
    // The frame takes the screenshot's own shape, so nothing is cropped.
    const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : undefined
    return (
      <div className={`relative overflow-hidden bg-surface ${className}`} style={{ aspectRatio }}>
        <img src={image.src} alt="" loading="lazy" className="size-full object-contain" />
      </div>
    )
  }

  const Composition = compositions[kind]
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 grid place-items-center p-[6%]" aria-hidden="true">
        <Composition />
      </div>
      <p className="label absolute bottom-3 left-3 rounded-full border border-line bg-ink/80 px-2.5 py-1 text-[0.6rem] text-muted">
        Concept visual — not a screenshot
      </p>
    </div>
  )
}
