/**
 * A static CSS rendition of the core. Shown while the WebGL chunk loads,
 * and permanently when WebGL is unavailable.
 */
export function ScenePoster({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-[30%] aspect-square w-[min(68vw,22rem)] -translate-x-1/2 -translate-y-1/2 md:left-[72%] md:top-1/2 md:w-[min(24vw,21rem)]">
        {/* Orbits */}
        <div className="absolute -inset-[42%] rotate-[-14deg] rounded-full border border-white/10 [transform:rotateX(68deg)]" />
        <div className="absolute -inset-[70%] rotate-[18deg] rounded-full border border-lime/40 [transform:rotateX(72deg)]" />
        {/* Chrome sphere */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 34% 26%, #ffffff 0%, #d9dee5 9%, #7d8693 30%, #2a3039 58%, #0d1015 78%), radial-gradient(circle at 80% 78%, rgba(182,255,74,0.55), transparent 45%)',
            backgroundBlendMode: 'screen',
            boxShadow: 'inset -18px -24px 60px rgba(182,255,74,0.22), 0 40px 120px rgba(0,0,0,0.6)',
          }}
        />
        {/* Light seam */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-lime/80 shadow-[0_0_12px_rgba(182,255,74,0.6)]" />
      </div>
    </div>
  )
}
