import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { profile } from '../../data/profile'
import { ButtonLink } from '../../components/ui/Button'
import { ResumeLink } from '../../components/ui/ResumeLink'
import { MOTION_OK, gsap, useGSAP } from '../../lib/gsap'

function Headline() {
  const { headline, accentWord } = profile.hero
  return (
    <h1 className="text-[clamp(2.9rem,6.4vw,6.6rem)] font-medium leading-[0.95] tracking-[-0.045em]">
      {headline.map((line) => {
        const accentAt = line.lastIndexOf(accentWord)
        return (
          // Each line is masked so its text can rise into view.
          <span key={line} className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
            {/* From tablet up each line stays whole; the font scales with the viewport, so it always fits. */}
            <span className="block md:whitespace-nowrap" data-hero-line>
              {accentAt === -1 ? (
                line
              ) : (
                <>
                  {line.slice(0, accentAt)}
                  <span className="text-lime">{accentWord}</span>
                  {line.slice(accentAt + accentWord.length)}
                </>
              )}
            </span>
          </span>
        )
      })}
    </h1>
  )
}

export function Hero() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const timeline = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.3 } })
        timeline
          .from('[data-hero-label]', { opacity: 0, y: 12, duration: 0.9 }, 0.15)
          .from('[data-hero-line]', { yPercent: 105, stagger: 0.12 }, 0.25)
          .from('[data-hero-fade]', { opacity: 0, y: 20, stagger: 0.08 }, 0.7)
      })
    },
    { scope },
  )

  return (
    <section
      ref={scope}
      id="top"
      aria-label="Introduction"
      className="relative flex min-h-[100svh] flex-col justify-end px-5 pb-10 pt-28 sm:px-8 md:justify-center md:pb-24 lg:px-12"
    >
      <div className="mx-auto w-full max-w-[90rem]">
        <div>
          <p className="label mb-7 flex items-center gap-3 text-lime" data-hero-label>
            <span className="size-1.5 rounded-full bg-lime" aria-hidden="true" />
            {profile.hero.label}
          </p>
          <Headline />
          <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-muted md:text-xl" data-hero-fade>
            {profile.hero.intro}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3" data-hero-fade>
            <ButtonLink to="/#work">
              Explore My Work
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" aria-hidden="true" />
            </ButtonLink>
            <ResumeLink />
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 mx-auto hidden max-w-[90rem] items-end justify-between px-5 pb-8 sm:px-8 md:flex lg:px-12"
        data-hero-fade
      >
        <a href="#work" className="group flex items-center gap-4 text-muted transition-colors hover:text-fg">
          <span className="scroll-cue relative h-12 w-px overflow-hidden bg-line-strong" aria-hidden="true" />
          <span className="label">Scroll to explore</span>
        </a>
        <p className="label max-w-xs text-right text-muted">Based in {profile.location}</p>
      </div>
    </section>
  )
}
