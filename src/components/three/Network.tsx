import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Object3D,
  ShaderMaterial,
  Vector3,
  type InstancedMesh,
  type LineBasicMaterial,
} from 'three'
import { graph, type GraphLinkKind, type GraphNodeKind } from '../../data/graph'
import { CAMERA_DISTANCE, RINGS, clamp01, graphSpan, isPortrait, layoutGraph, mix, referenceViewport, smoothstep } from './layout'
import type { CoreRig } from './Core'
import { blastAt, graphBridge, implodeAt, sceneInput, type SceneMotion } from './sceneStore'
import { introStages } from './intro'

interface NetworkProps {
  motion: RefObject<SceneMotion>
  rig: RefObject<CoreRig>
  reducedMotion: boolean
  /** Brightness multiplier for highlighted accents; above 1 they bloom. */
  glow: number
}

const LIME = new Color('#B6FF4A')
const BASE_COLOR: Record<GraphNodeKind, Color> = {
  core: new Color('#F5F7FA'),
  project: new Color('#B6FF4A'),
  group: new Color('#F5F7FA'),
  skill: new Color('#8B93A1'),
}
const SIZE: Record<GraphNodeKind, number> = { core: 0, project: 0.14, group: 0.11, skill: 0.06 }
/** A spotlit satellite grows by this much, and the other satellites dim to this brightness. */
const SPOTLIGHT_GROWTH = 1.3
const SPOTLIGHT_DIM = 0.3
/** Link brightness while nothing is focused. Skill-level detail stays hidden until explored. */
const IDLE_LINK: Record<GraphLinkKind, number> = { structure: 0.5, summary: 0.32, detail: 0 }

const placements = layoutGraph(graph)
const indexById = new Map(graph.nodes.map((node, i) => [node.id, i]))
const NODE_COUNT = graph.nodes.length

/**
 * Points of light travelling along the links, in the direction the graph reads:
 * you → disciplines → skills → projects. Links are stored in that direction.
 */
const PULSES_PER_LINK = 2
/** Trips per second along a link: at rest, and on the path being explored. */
const PULSE_SPEED = { idle: 0.2, active: 0.65 }
const PULSE_SIZE = 16
/** Near-white lime, so pulses read as light travelling along the lime lines rather than blending into them. */
const PULSE_COLOR = new Color('#F2FFD9')

const pulseVertex = /* glsl */ `
  uniform float uPixelRatio;
  attribute float aBright;
  varying float vBright;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = ${PULSE_SIZE.toFixed(1)} * uPixelRatio * (${CAMERA_DISTANCE.toFixed(1)} / -viewPosition.z);
    vBright = aBright;
  }
`

const pulseFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vBright;
  void main() {
    // A bright core inside a soft glow, so it reads as a point of light. (Inverted smoothstep: edge0 must stay below edge1.)
    float r = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.06, 0.16, r);
    float halo = 1.0 - smoothstep(0.0, 0.5, r);
    float strength = (core + halo * halo * 0.45) * vBright;
    if (strength < 0.004) discard;
    // Brightness above 1 is kept in the colour so highlighted pulses bloom.
    gl_FragColor = vec4(uColor * strength, min(strength, 1.0));
  }
`

const dummy = new Object3D()
const projected = new Vector3()
const colour = new Color()

/** Which parts of the graph are open for the current focus. */
function explore(focus: number) {
  const node = focus === -1 ? null : graph.nodes[focus]
  // The discipline being explored: the focused one, or the parent of a focused skill.
  let group = -1
  if (node?.kind === 'group') group = focus
  if (node?.kind === 'skill') group = node.parent ?? -1
  const project = node?.kind === 'project' ? focus : -1
  const near = focus === -1 ? [] : graph.neighbours[focus]

  // Skills are shown only for the discipline being explored, or as evidence for a focused project.
  const revealed = (i: number) => {
    const n = graph.nodes[i]
    if (n.kind !== 'skill') return true
    return (group !== -1 && n.parent === group) || (project !== -1 && near.includes(i))
  }
  const lit = (i: number) =>
    focus === -1 || i === focus || near.includes(i) || (group !== -1 && (i === group || graph.nodes[i].parent === group))
  return { group, revealed, lit, touches: (a: number, b: number) => a === focus || b === focus }
}

/**
 * The skills graph. Folded around the core in the hero, it unfolds into a
 * calm map of disciplines and projects; exploring a node fans out the skills
 * behind it.
 */
export function Network({ motion, rig, reducedMotion, glow }: NetworkProps) {
  const size = useThree((state) => state.size)
  const viewport = useMemo(() => referenceViewport(size), [size])
  const nodesMesh = useRef<InstancedMesh>(null)
  const lineMaterial = useRef<LineBasicMaterial>(null)

  const positions = useMemo(() => graph.nodes.map(() => new Vector3()), [])
  // Smoothed per-node visibility (skills fan out from their discipline) and highlight.
  const reveal = useMemo(() => Float32Array.from(graph.nodes, (n) => (n.kind === 'skill' ? 0 : 1)), [])
  const nodeGlow = useMemo(() => new Float32Array(NODE_COUNT).fill(1), [])
  const linkGlow = useMemo(() => Float32Array.from(graph.linkKinds, (kind) => IDLE_LINK[kind]), [])
  // Smoothed card spotlight: per node, and whether any satellite is spotlit at all.
  const spot = useMemo(() => new Float32Array(NODE_COUNT), [])
  const spotActive = useRef(0)

  const lineGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(graph.links.length * 6), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(graph.links.length * 6), 3))
    return geometry
  }, [])
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry])

  const pulseCount = graph.links.length * PULSES_PER_LINK
  const pulsePhase = useMemo(() => Float32Array.from(graph.links, () => Math.random()), [])
  const pulseGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(pulseCount * 3), 3))
    geometry.setAttribute('aBright', new BufferAttribute(new Float32Array(pulseCount), 1))
    return geometry
  }, [pulseCount])
  const pulseMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: pulseVertex,
        fragmentShader: pulseFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: { uColor: { value: PULSE_COLOR.clone() }, uPixelRatio: { value: 1 } },
      }),
    [],
  )
  useEffect(
    () => () => {
      pulseGeometry.dispose()
      pulseMaterial.dispose()
    },
    [pulseGeometry, pulseMaterial],
  )

  useEffect(() => {
    graphBridge.screen = new Float32Array(NODE_COUNT * 3)
    return () => {
      graphBridge.screen = new Float32Array(0)
    }
  }, [])

  useFrame((state, delta) => {
    const m = motion.current
    const core = rig.current.core
    const mesh = nodesMesh.current
    if (!core || !mesh || !lineMaterial.current) return

    const spread = smoothstep(m.network)
    const portrait = isPortrait(viewport)
    const span = graphSpan(viewport)
    const dt = Math.min(delta, 0.1)
    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 10)
    const unfold = reducedMotion ? 1 : 1 - Math.exp(-dt * 7)
    const focus = sceneInput.focus ? (indexById.get(sceneInput.focus) ?? -1) : -1
    const view = explore(focus)
    // Opening sequence: satellites sweep in from wide orbits and settle onto their rings.
    const settle = introStages(m.intro).satellites
    // A hovered project card lights its satellite. Only while the system is still in orbit:
    // once the graph has formed, its own focus highlighting takes over.
    const spotlight = sceneInput.spotlight ? (indexById.get(`project:${sceneInput.spotlight}`) ?? -1) : -1
    // Fully gone well before the graph has formed, so it can never linger on a graph node.
    const orbiting = clamp01(1 - spread * 3)
    spotActive.current += ((spotlight === -1 ? 0 : 1) - spotActive.current) * ease
    const pulse = reducedMotion ? 1 : 1 + Math.sin(m.time * 5) * 0.08
    // Supernova: the whole system falls into the core (implode), the chosen project burning
    // brightest as it goes, then is blown apart as the core detonates (blast).
    const flight = sceneInput.flyTo ? (indexById.get(`project:${sceneInput.flyTo}`) ?? -1) : -1
    const implode = flight === -1 ? 0 : implodeAt(m.fly)
    const blast = flight === -1 ? 0 : blastAt(m.fly)
    const pulling = implode > 0

    // Node positions, sizes and colours.
    graph.nodes.forEach((node, i) => {
      const target = positions[i]
      reveal[i] += ((view.revealed(i) ? 1 : 0) - reveal[i]) * unfold
      nodeGlow[i] += ((view.lit(i) ? 1 : 0.22) - nodeGlow[i]) * ease
      spot[i] += ((i === spotlight ? 1 : 0) - spot[i]) * ease

      if (node.kind === 'core') {
        target.copy(core.position)
        return
      }

      const place = placements[i]
      const ring = RINGS[place.ring]
      const ringGroup = rig.current.rings[place.ring]
      const angle = place.phase + m.time * ring.speed * 3 + (1 - settle) * 1.6
      const radius = ring.radius * mix(1.9, 1, settle)
      // Position on the node's orbit ring, in world space.
      projected.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      if (ringGroup) {
        ringGroup.updateWorldMatrix(true, false)
        ringGroup.localToWorld(projected)
      }
      const drift = Math.sin(m.time * 0.5 + place.phase) * 0.04
      target.set(place.target[0] * span.x, place.target[1] * span.y + span.centreY + drift, place.target[2] - 0.5)
      // Skills grow out of their discipline (computed earlier in this loop) as they are revealed.
      if (node.parent !== undefined) target.lerpVectors(positions[node.parent], target, reveal[i])
      target.lerpVectors(projected, target, spread)
      if (pulling) target.lerp(core.position, implode)

      // Skills only exist once the graph unfolds; projects and disciplines also orbit in the hero.
      const orbitSize = node.kind === 'skill' ? 0 : 0.06 * core.scale.x * 1.6 * settle
      const focused = i === focus ? 1.45 : 1
      const lit = spot[i] * orbiting
      // Everything shrinks as it falls in (the project least), so it merges into the core rather than piling up.
      const supernova = mix(1, i === flight ? 0.6 : 0.25, implode) * (1 - blast)
      const spotScale = mix(1, (1 + SPOTLIGHT_GROWTH) * pulse, lit) * supernova
      dummy.position.copy(target)
      dummy.rotation.set(m.time * 0.4 + i, m.time * 0.3 + i * 0.5, 0)
      dummy.scale.setScalar(mix(orbitSize, SIZE[node.kind], spread) * focused * spotScale * reveal[i])
      dummy.updateMatrix()
      mesh.setMatrixAt(i - 1, dummy.matrix)

      colour.copy(BASE_COLOR[node.kind])
      if (i === focus) colour.lerp(LIME, 0.85).multiplyScalar(mix(1, glow, 0.7))
      // The spotlit satellite is pushed past white so it blooms; the others step back.
      const dim = mix(1, SPOTLIGHT_DIM, spotActive.current * orbiting * (1 - spot[i]))
      // A sent message's pulse lights every satellite as it passes.
      const flash = m.burst < 1 ? 1 + glow * 1.2 * (1 - m.burst) ** 2 : 1
      // The collapsing project burns ever brighter; everything falling into it heats up, then is blown out.
      const burn = i === flight ? 1 + glow * 3 * implode : (1 + 0.6 * implode) * (1 - blast)
      colour.multiplyScalar(mix(1, glow * 1.4, lit) * dim * flash * burn)
      mesh.setColorAt(i - 1, colour.multiplyScalar(0.25 + nodeGlow[i] * 0.75))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

    // Where the supernova is, for the dust.
    graphBridge.hasFlightTarget = flight !== -1
    if (flight !== -1) {
      graphBridge.flightTarget.x = core.position.x
      graphBridge.flightTarget.y = core.position.y
      graphBridge.flightTarget.z = core.position.z
    }

    // Links follow the nodes. Focus lights its own links; skill-level detail appears only with its skills.
    const linePositions = lineGeometry.getAttribute('position') as BufferAttribute
    const lineColors = lineGeometry.getAttribute('color') as BufferAttribute
    const posArray = linePositions.array as Float32Array
    const colArray = lineColors.array as Float32Array
    const pulsePositions = pulseGeometry.getAttribute('position') as BufferAttribute
    const pulseBright = pulseGeometry.getAttribute('aBright') as BufferAttribute
    const pulsePosArray = pulsePositions.array as Float32Array
    const pulseBrightArray = pulseBright.array as Float32Array
    // Pulses appear with the formed graph, and not at all when motion is reduced.
    const pulsesOn = !reducedMotion && spread > 0.01 && flight === -1
    graph.links.forEach(([a, b], i) => {
      const from = positions[a]
      const to = positions[b]
      posArray.set([from.x, from.y, from.z, to.x, to.y, to.z], i * 6)

      const kind = graph.linkKinds[i]
      let target = IDLE_LINK[kind]
      if (focus !== -1) {
        if (view.touches(a, b)) target = 1
        else if (kind === 'detail') target = 0.5
        else if (kind === 'structure' && (a === view.group || b === view.group)) target = 0.8
        else target = 0.06
      }
      linkGlow[i] += (target - linkGlow[i]) * ease
      const lit = kind === 'detail' ? linkGlow[i] * Math.min(reveal[a], reveal[b]) : linkGlow[i]
      // Only highlighted links are pushed past white, so hovering makes a path glow.
      const highlight = clamp01((lit - 0.6) / 0.4)
      const g = lit * mix(1, glow, highlight)
      colArray.set([LIME.r * g, LIME.g * g, LIME.b * g, LIME.r * g, LIME.g * g, LIME.b * g], i * 6)

      // Pulses speed up on highlighted links, and fade in and out at each end so they never pop.
      if (!pulsesOn) return
      pulsePhase[i] = (pulsePhase[i] + dt * mix(PULSE_SPEED.idle, PULSE_SPEED.active, highlight)) % 1
      for (let p = 0; p < PULSES_PER_LINK; p++) {
        const t = (pulsePhase[i] + p / PULSES_PER_LINK) % 1
        const k = i * PULSES_PER_LINK + p
        pulsePosArray[k * 3] = mix(from.x, to.x, t)
        pulsePosArray[k * 3 + 1] = mix(from.y, to.y, t)
        pulsePosArray[k * 3 + 2] = mix(from.z, to.z, t)
        // Any visible link carries clearly visible pulses; highlighted ones are pushed further so they bloom.
        const visible = clamp01(lit * 2.5)
        pulseBrightArray[k] = visible * Math.sin(Math.PI * t) * spread * spread * mix(1.4, glow * 2, highlight)
      }
    })
    linePositions.needsUpdate = true
    lineColors.needsUpdate = true
    pulseMaterial.visible = pulsesOn
    if (pulsesOn) {
      pulsePositions.needsUpdate = true
      pulseBright.needsUpdate = true
      pulseMaterial.uniforms.uPixelRatio.value = state.viewport.dpr
    }
    lineMaterial.current.opacity = spread * spread * (1 - blast)
    lineMaterial.current.visible = spread > 0.01

    // Screen positions for hit-testing and the HTML labels.
    const { width, height } = state.size
    const labelBase = clamp01((spread - 0.7) / 0.3)
    graph.nodes.forEach((node, i) => {
      projected.copy(positions[i]).project(state.camera)
      const x = (projected.x * 0.5 + 0.5) * width
      const y = (-projected.y * 0.5 + 0.5) * height
      // Only fully formed, visible nodes can be hovered or clicked.
      graphBridge.screen.set([x, y, spread > 0.85 && reveal[i] > 0.6 ? 1 : 0], i * 3)

      const label = graphBridge.labels[i]
      if (!label) return
      // Narrow screens are too tight for resting labels; tapping a node reveals its neighbourhood instead.
      const showIdle = node.kind === 'core' || (!portrait && node.kind !== 'skill')
      // While exploring on narrow screens, skills are listed in an HTML panel instead of labelled here.
      const showFocused = view.lit(i) && !(portrait && node.kind === 'skill')
      const show = focus === -1 ? showIdle : showFocused
      label.style.opacity = String(show ? labelBase * clamp01(reveal[i] * 2 - 1) : 0)
      label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      const labelState = i === focus ? 'focus' : 'idle'
      if (label.dataset.state !== labelState) label.dataset.state = labelState
    })
  })

  return (
    <>
      <instancedMesh ref={nodesMesh} args={[undefined, undefined, NODE_COUNT - 1]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial metalness={0.35} roughness={0.35} envMapIntensity={1.2} flatShading toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={lineGeometry} frustumCulled={false}>
        <lineBasicMaterial ref={lineMaterial} vertexColors transparent opacity={0} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <points geometry={pulseGeometry} material={pulseMaterial} frustumCulled={false} />
    </>
  )
}
