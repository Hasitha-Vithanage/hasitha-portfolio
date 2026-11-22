import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Keep intro animations on wall-clock time. With lag smoothing, a slow device
// busy compiling WebGL shaders would hold content invisible for longer.
gsap.ticker.lagSmoothing(0)

export const MOTION_OK = '(prefers-reduced-motion: no-preference)'

export { gsap, ScrollTrigger, useGSAP }
