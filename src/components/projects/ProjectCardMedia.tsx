import { useEffect, useRef, useState } from 'react'
import type { Project } from '../../data/projects'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery'
import { MOTION_OK, gsap, useGSAP } from '../../lib/gsap'
import { ProjectPreview } from './ProjectPreview'

const FRAME_MS = 1600
const MAX_TILT = { x: 5, y: 7 }

interface ProjectCardMediaProps {
  project: Project
  /** True while the card is hovered; plays the recording or cycles the screenshots. */
  active: boolean
  className?: string
}

/**
 * The card's visual. At rest it shows the cover screenshot; while the card is
 * hovered it plays the project's screen recording if there is one, otherwise
 * crossfades through its screenshots. Projects without screenshots keep their
 * concept visual. Extra frames are only fetched after the first hover.
 */
export function ProjectCardMedia({ project, active, className = '' }: ProjectCardMediaProps) {
  const shots = project.screenshots.filter((shot) => shot.src)
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [warmed, setWarmed] = useState(false)
  const playing = active && !reducedMotion
  const cycling = playing && !project.video && shots.length > 1

  useEffect(() => {
    if (active) setWarmed(true)
  }, [active])

  useEffect(() => {
    if (!cycling) {
      setIndex(0)
      return
    }
    const timer = setInterval(() => setIndex((i) => (i + 1) % shots.length), FRAME_MS)
    return () => clearInterval(timer)
  }, [cycling, shots.length])

  if (shots.length === 0) return <ProjectPreview kind={project.preview} className={className} />

  // The frame takes the cover screenshot's own shape, so nothing is cropped.
  const cover = shots[0]
  const aspectRatio = cover.width && cover.height ? `${cover.width} / ${cover.height}` : undefined

  return (
    <div className={`relative overflow-hidden bg-surface ${className}`} style={{ aspectRatio }}>
      {shots.map(
        (shot, i) =>
          (i === 0 || warmed) && (
            <img
              key={shot.src}
              src={shot.src}
              alt=""
              loading="lazy"
              decoding="async"
              // Contained, so a frame with a different shape from the cover is never cut off.
              className={`absolute inset-0 size-full object-contain transition-opacity duration-700 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ),
      )}
      {project.video && playing && (
        <video
          src={project.video}
          poster={shots[0].src}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 size-full object-contain"
        />
      )}
      {cycling && (
        <div className="absolute bottom-3 left-3 flex gap-1.5 rounded-full bg-ink/70 px-2.5 py-1.5">
          {shots.map((shot, i) => (
            <span
              key={shot.src}
              className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-4 bg-lime' : 'w-1 bg-fg/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Tilts an element gently towards the pointer.
 * Fine pointers only, and off when reduced motion is requested.
 * Uses GSAP so the rotation composes with the card's scroll-reveal transform.
 */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const finePointer = useMediaQuery('(pointer: fine)')

  useGSAP(
    () => {
      const element = ref.current
      if (!element || !finePointer) return
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.set(element, { transformPerspective: 1100 })
        const rotateX = gsap.quickTo(element, 'rotationX', { duration: 0.7, ease: 'power3.out' })
        const rotateY = gsap.quickTo(element, 'rotationY', { duration: 0.7, ease: 'power3.out' })

        const onMove = (event: PointerEvent) => {
          const bounds = element.getBoundingClientRect()
          const x = (event.clientX - bounds.left) / bounds.width
          const y = (event.clientY - bounds.top) / bounds.height
          rotateY((x - 0.5) * 2 * MAX_TILT.y)
          rotateX((0.5 - y) * 2 * MAX_TILT.x)
        }
        const onLeave = () => {
          rotateX(0)
          rotateY(0)
        }

        element.addEventListener('pointermove', onMove)
        element.addEventListener('pointerleave', onLeave)
        return () => {
          element.removeEventListener('pointermove', onMove)
          element.removeEventListener('pointerleave', onLeave)
          gsap.set(element, { rotationX: 0, rotationY: 0 })
        }
      })
    },
    { dependencies: [finePointer] },
  )

  return ref
}
