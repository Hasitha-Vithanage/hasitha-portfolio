import { useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import type { DirectionalLight } from 'three'
import type { SceneMotion } from './sceneStore'
import { createMood, moodAt } from './mood'

/**
 * Studio lighting. The environment map is generated once from soft panels,
 * so the chrome has clean, photographic reflections without an HDR download.
 */
export function Lighting({ motion }: { motion: RefObject<SceneMotion> }) {
  const [mood] = useState(createMood)
  const rim = useRef<DirectionalLight>(null)

  useFrame(() => {
    // The rim light carries the section mood: tone and strength follow the scroll.
    if (!rim.current) return
    const { hero, network } = motion.current
    const tone = moodAt(hero, network, mood)
    rim.current.color.copy(tone.color)
    rim.current.intensity = (3 - network * 1.5) * tone.intensity
  })

  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-4, 5, 5]} intensity={1.2} />
      <directionalLight ref={rim} position={[5, 1.5, -4]} intensity={3} color="#B6FF4A" />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#040507']} />
        {/* Large overhead softbox: the main highlight */}
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 2]} scale={[14, 5, 1]} target={[0, 0, 0]} />
        {/* Narrow vertical strip: a crisp edge highlight on the left */}
        <Lightformer form="rect" intensity={1.6} position={[-7, 0.5, 2]} scale={[0.8, 9, 1]} target={[0, 0, 0]} />
        {/* Tall lime panel behind and to the right: the accent rim reflection */}
        <Lightformer form="rect" color="#B6FF4A" intensity={2.2} position={[6, 0, -5]} scale={[2.5, 10, 1]} target={[0, 0, 0]} />
        {/* Faint horizon band, gives the lower hemisphere depth */}
        <Lightformer form="rect" color="#7D8796" intensity={0.45} position={[0, -1.5, -9]} scale={[24, 1.2, 1]} target={[0, 0, 0]} />
        {/* Soft horizon in front of the sphere: a gentle band across the lower hemisphere */}
        <Lightformer form="rect" color="#8A94A3" intensity={0.7} position={[0, -3, 9]} scale={[30, 1.6, 1]} target={[0, 0, 0]} />
        {/* Floor bounce */}
        <Lightformer form="rect" color="#4A5363" intensity={0.8} position={[0, -7, 3]} scale={[14, 6, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  )
}
