import { useRef, useState } from 'react'
import { SceneLayer } from '../../components/three/SceneLayer'
import { setSceneInput } from '../../components/three/sceneStore'
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from '../../lib/gsap'
import { usePageMeta } from '../../hooks/usePageMeta'
import { Hero } from '../../sections/Hero/Hero'
import { FeaturedProjects } from '../../sections/FeaturedProjects/FeaturedProjects'
import { Capabilities } from '../../sections/Capabilities/Capabilities'
import { About } from '../../sections/About/About'
import { Contact } from '../../sections/Contact/Contact'

export default function Home() {
  usePageMeta()
  const scope = useRef<HTMLDivElement>(null)
  const [sceneActive, setSceneActive] = useState(true)
  // The scene sleeps between the graph and the contact section, then returns for the finale.
  const [finaleActive, setFinaleActive] = useState(false)

  useGSAP(
    () => {
      // Scroll progress feeds the WebGL scene through the shared store.
      setSceneInput({ hero: 0, network: 0, focus: null, spotlight: null, finale: 0, flyTo: null })
      // The graph forms inside its stage; without WebGL there is no stage, so fall back to the section.
      const stage = scope.current?.querySelector('[data-graph-stage]') ?? '#capabilities'
      ScrollTrigger.create({
        trigger: '#top',
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => setSceneInput({ hero: self.progress }),
      })
      // A card's satellite spotlight ends with the project section. Scrolling moves a card out from under
      // a still pointer without a pointerleave, so it is cleared here as well as by the card itself.
      ScrollTrigger.create({
        trigger: '#work',
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => setSceneInput({ spotlight: null }),
        onLeaveBack: () => setSceneInput({ spotlight: null }),
      })
      // The graph unfolds as its stage scrolls in and folds back up as it scrolls out — the same in both directions.
      let unfolded = 0
      let folded = 0
      const updateNetwork = () => {
        const network = unfolded * (1 - folded)
        // Nothing stays selected on a graph that is folding away.
        setSceneInput(network < 0.6 ? { network, focus: null } : { network })
      }
      ScrollTrigger.create({
        trigger: stage,
        start: 'top 85%',
        end: 'center 55%',
        onUpdate: (self) => {
          unfolded = self.progress
          updateNetwork()
        },
      })
      ScrollTrigger.create({
        trigger: stage,
        // Starts while the space above the cards is still open, so the fold is visible.
        start: 'bottom 80%',
        end: 'bottom 35%',
        onUpdate: (self) => {
          folded = self.progress
          updateNetwork()
        },
      })
      // Stop rendering once the graph stage has scrolled away, resume when it comes back.
      // (A range starting at scroll 0 would also switch off when returning to the very top.)
      ScrollTrigger.create({
        trigger: stage,
        start: 'bottom top',
        onEnter: () => setSceneActive(false),
        onLeaveBack: () => setSceneActive(true),
      })

      // The scene recedes behind the project cards, returns as the graph forms, then fades out once it has folded.
      // Tweened as a CSS variable, so a hovered project card can lift the layer on top of it (see SceneLayer).
      const layer = '[data-scene-layer]'
      gsap.fromTo(
        layer,
        { '--scene-fade': 1 },
        { '--scene-fade': 0.18, ease: 'none', scrollTrigger: { trigger: '#work', start: 'top 70%', end: 'top 10%', scrub: true } },
      )
      gsap.fromTo(
        layer,
        { '--scene-fade': 0.18 },
        {
          '--scene-fade': 1,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top 45%', scrub: true },
        },
      )
      gsap.fromTo(
        layer,
        { '--scene-fade': 1 },
        {
          '--scene-fade': 0,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: stage, start: 'bottom 15%', end: 'bottom top', scrub: true },
        },
      )

      // Finale: as the contact section arrives, the system returns in its signature lime behind it.
      ScrollTrigger.create({
        trigger: '#contact',
        start: 'top bottom',
        end: 'top 35%',
        onUpdate: (self) => setSceneInput({ finale: self.progress }),
        onEnter: () => setFinaleActive(true),
        onLeaveBack: () => {
          setFinaleActive(false)
          setSceneInput({ finale: 0 })
        },
      })
      gsap.fromTo(
        layer,
        { '--scene-fade': 0 },
        {
          '--scene-fade': 0.7,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '#contact', start: 'top 85%', end: 'top 30%', scrub: true },
        },
      )

      gsap.matchMedia().add(MOTION_OK, () => {
        // Headings, copy and cards reveal as they enter.
        gsap.set('[data-reveal]', { opacity: 0, y: 28 })
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
        })

        // Project previews unmask from the bottom; text follows.
        gsap.utils.toArray<HTMLElement>('[data-project-card]').forEach((card) => {
          const preview = card.querySelector('[data-project-preview]')
          const text = card.querySelectorAll(':scope > div > *')
          gsap
            .timeline({ scrollTrigger: { trigger: card, start: 'top 80%', once: true } })
            .from(preview, { clipPath: 'inset(18% 0% 0% 0% round 1rem)', opacity: 0, y: 40, duration: 1.3, ease: 'expo.out' })
            .from(text, { opacity: 0, y: 24, stagger: 0.07, duration: 0.9, ease: 'expo.out' }, 0.15)
        })
      })

      // Late-loading fonts change heights; re-measure trigger positions.
      void document.fonts?.ready.then(() => ScrollTrigger.refresh())
    },
    { scope },
  )

  return (
    <div ref={scope}>
      <SceneLayer active={sceneActive || finaleActive} />
      {/* Faded on its own (without the scene) when flying into a case study; see Layout. */}
      <div className="relative z-10" data-page-content>
        <Hero />
        <FeaturedProjects />
        <Capabilities />
        <About />
        <Contact />
      </div>
    </div>
  )
}
