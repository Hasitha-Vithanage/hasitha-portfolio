import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  Color,
  FrontSide,
  PerspectiveCamera,
  ShaderMaterial,
  Vector3,
  type Camera,
  type Group,
  type Mesh,
} from 'three'
import { RINGS, coreTransform, mix, referenceViewport } from './layout'
import { introStages } from './intro'
import { createMood, moodAt } from './mood'
import { createRingMaterial } from './ringMaterial'
import { createPanelMaterial } from './panelMaterial'
import { coreBridge, implodeAt, type SceneMotion } from './sceneStore'

const LIME = '#B6FF4A'
const SILVER = '#C9D1DC'

export interface CoreRig {
  core: Group | null
  rings: (Group | null)[]
}

interface CoreProps {
  motion: RefObject<SceneMotion>
  rig: RefObject<CoreRig>
  /** Brightness multiplier for lime accents; above 1 they exceed white and bloom. */
  glow: number
}

const glowVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`

/** Fresnel rim on the sphere's surface, strongest on the side facing the key rim light. */
const rimFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLight;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Clamped: interpolated normals can make the dot product a hair over 1, and pow() of a
    // negative base is NaN, which bloom's blur would smear across the whole frame as black.
    float fresnel = pow(clamp(1.0 - dot(vNormal, vView), 0.0, 1.0), 3.5);
    float side = 0.25 + 0.75 * max(dot(vNormal, uLight), 0.0);
    float strength = fresnel * side * uIntensity;
    gl_FragColor = vec4(uColor * strength, strength);
  }
`

/**
 * Soft halo: drawn on the far side of a slightly larger shell. Brightest where
 * it meets the sphere's silhouette, fading to nothing at the shell's edge.
 */
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uEdge;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float towardsSphere = clamp(-dot(vNormal, vView) / uEdge, 0.0, 1.0);
    float strength = pow(towardsSphere, 2.6) * uIntensity;
    gl_FragColor = vec4(uColor * strength, strength);
  }
`

const HALO_RADIUS = 1.32
/** How far the message pulse travels, as a multiple of the sphere's radius: past the outermost ring. */
const WAVE_REACH = 3.6
const ACCENT_RING = RINGS.find((ring) => ring.accent) ?? RINGS[RINGS.length - 1]

function useGlowMaterials() {
  const materials = useMemo(() => {
    const color = new Color(LIME)
    const shared = { transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }
    const rim = new ShaderMaterial({
      ...shared,
      side: FrontSide,
      vertexShader: glowVertex,
      fragmentShader: rimFragment,
      uniforms: {
        uColor: { value: color },
        uLight: { value: new Vector3(0.75, 0.35, -0.2).normalize() },
        uIntensity: { value: 1.1 },
      },
    })
    const halo = new ShaderMaterial({
      ...shared,
      side: BackSide,
      vertexShader: glowVertex,
      fragmentShader: haloFragment,
      uniforms: {
        uColor: { value: color },
        uIntensity: { value: 0.32 },
        // How far "towards the sphere" the halo reaches its peak: the sphere's silhouette on the shell.
        uEdge: { value: Math.sqrt(1 - 1 / (HALO_RADIUS * HALO_RADIUS)) },
      },
    })
    return { rim, halo }
  }, [])
  useEffect(
    () => () => {
      materials.rim.dispose()
      materials.halo.dispose()
    },
    [materials],
  )
  return materials
}

/** The seam and orbit rings, drawn with a material that can trace them in during the intro. */
function useLineMaterials(glow: number) {
  const materials = useMemo(
    () => ({
      seam: createRingMaterial(new Color(LIME), 1, 0.25),
      rings: RINGS.map((ring, i) =>
        createRingMaterial(new Color(ring.accent ? LIME : SILVER), ring.accent ? 0.6 : 0.2, 0.15 + i * 0.3),
      ),
      wave: createRingMaterial(new Color(LIME), 0, 0),
    }),
    [],
  )
  useEffect(
    () => () => {
      materials.seam.dispose()
      materials.wave.dispose()
      materials.rings.forEach((material) => material.dispose())
    },
    [materials],
  )
  // Lime accents are pushed past white when bloom is on, so they glow.
  useEffect(() => {
    const accent = new Color(LIME).multiplyScalar(glow)
    materials.seam.uniforms.uColor.value.copy(accent)
    materials.wave.uniforms.uColor.value.copy(accent).multiplyScalar(1.5)
    RINGS.forEach((ring, i) => {
      if (!ring.accent) return
      materials.rings[i].uniforms.uColor.value.copy(accent)
      materials.rings[i].uniforms.uOpacity.value = glow > 1 ? 0.85 : 0.6
    })
  }, [materials, glow])
  return materials
}

const projected = new Vector3()

/**
 * Where the telemetry callouts leave the sphere: four points on its front face,
 * one per quadrant (upper left, upper right, lower right, lower left), in the
 * core's own space. The core group doesn't spin, so they stay facing the viewer.
 */
const CALLOUT_ANCHORS = [
  new Vector3(-0.58, 0.58, 0.57),
  new Vector3(0.6, 0.55, 0.58),
  new Vector3(0.62, -0.52, 0.59),
  new Vector3(-0.6, -0.55, 0.58),
].map((v) => v.normalize())

/**
 * Tells the page where the sphere is on screen, so a click on it can be recognised
 * (the canvas itself takes no pointer events). Only in the hero and the contact
 * finale, where the sphere stands alone and the graph is folded away.
 */
function publishScreenPosition(camera: Camera, size: { width: number; height: number }, core: Group, m: SceneMotion) {
  projected.copy(core.position).project(camera)
  coreBridge.x = (projected.x * 0.5 + 0.5) * size.width
  coreBridge.y = (-projected.y * 0.5 + 0.5) * size.height
  const distance = camera.position.distanceTo(core.position)
  const fov = camera instanceof PerspectiveCamera ? camera.fov : 35
  coreBridge.radius = (core.scale.x / (distance * Math.tan((fov * Math.PI) / 360))) * (size.height / 2)
  coreBridge.clickable = m.intro >= 1 && m.network < 0.05 && (m.hero < 0.3 || m.finale > 0.8)

  core.updateWorldMatrix(true, false)
  CALLOUT_ANCHORS.forEach((anchor, i) => {
    projected.copy(anchor)
    core.localToWorld(projected).project(camera)
    coreBridge.anchors[i * 2] = (projected.x * 0.5 + 0.5) * size.width
    coreBridge.anchors[i * 2 + 1] = (-projected.y * 0.5 + 0.5) * size.height
  })
}

/** The central core: polished chrome sphere, lime rim glow, a fine light seam and orbit rings. */
export function Core({ motion, rig, glow }: CoreProps) {
  const size = useThree((state) => state.size)
  const viewport = useMemo(() => referenceViewport(size), [size])
  const tilt = useRef<Group>(null)
  const sphere = useRef<Group>(null)
  const shockwave = useRef<Mesh>(null)
  const glowMaterials = useGlowMaterials()
  const [mood] = useState(createMood)
  const lines = useLineMaterials(glow)
  const plating = useMemo(createPanelMaterial, [])
  useEffect(() => () => plating.dispose(), [plating])

  useFrame((state) => {
    const m = motion.current
    const core = rig.current.core
    if (!core || !tilt.current || !sphere.current) return
    publishScreenPosition(state.camera, state.size, core, m)

    // Opening sequence: the system grows in, its glow brightens, then the rings trace themselves.
    const intro = introStages(m.intro)
    const { position, scale } = coreTransform(viewport, m.network)
    core.position.set(position[0], position[1], position[2])
    // Supernova: the core collapses to a blazing point as the system falls into it.
    const implode = implodeAt(m.fly)
    core.scale.setScalar(scale * mix(0.55, 1, intro.sphere) * mix(1, 0.06, implode))

    // With bloom, the rim is pushed past white so it blooms, and the shader halo steps back for the real one.
    const blooming = glow > 1
    // Section mood: the glow's tone and strength follow the scroll (shared by rim and halo).
    const tone = moodAt(m.hero, m.network, mood, m.finale)
    // A sent message flashes the rim, then lets it settle; a click scan brightens it a little.
    const flash =
      (m.burst < 1 ? 1 + 2.2 * (1 - m.burst) ** 3 : 1) * (m.scan < 1 ? 1 + 0.6 * (1 - m.scan) ** 2 : 1) * (1 + 4 * implode)
    plating.scan.progress.value = m.scan
    plating.scan.color.value.copy(tone.color).multiplyScalar(glow)
    glowMaterials.rim.uniforms.uColor.value.copy(tone.color)
    glowMaterials.rim.uniforms.uIntensity.value = (blooming ? 1.9 : 1.1) * intro.sphere * tone.intensity * flash
    glowMaterials.halo.uniforms.uIntensity.value = (blooming ? 0.16 : 0.32) * intro.sphere * tone.intensity * flash

    // ...and sends a wave outward through the plane of the lime ring.
    const wave = shockwave.current
    if (wave) {
      wave.visible = m.burst < 1
      if (wave.visible) {
        const travel = 1 - (1 - m.burst) ** 3
        wave.scale.setScalar(mix(1.05, WAVE_REACH, travel))
        lines.wave.uniforms.uOpacity.value = (1 - m.burst) ** 1.5 * 0.9
      }
    }
    lines.seam.uniforms.uProgress.value = intro.seam
    lines.rings.forEach((material, i) => {
      material.uniforms.uProgress.value = intro.ring(i)
    })

    // The orbital system drifts slowly and leans a little toward the pointer.
    tilt.current.rotation.set(
      0.12 + Math.sin(m.time * 0.3) * 0.04 - m.pointerY * 0.15 + m.hero * 0.2,
      m.time * 0.05 + m.pointerX * 0.25,
      -0.08 + m.network * 0.15,
    )
    // The sphere turns independently so its seam catches the light.
    sphere.current.rotation.set(0.35, m.time * 0.18, 0.1)
  })

  return (
    <group
      ref={(node) => {
        rig.current.core = node
      }}
    >
      <group ref={tilt}>
        <group ref={sphere}>
          {/* Chrome with engineered panel plating, visible where reflections are bright */}
          <mesh material={plating}>
            <sphereGeometry args={[1, 128, 96]} />
          </mesh>
          {/* Fine light seam around the equator */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={lines.seam}>
            <torusGeometry args={[1.004, 0.0075, 10, 256]} />
          </mesh>
        </group>

        {/* Glow layers */}
        <mesh material={glowMaterials.rim} scale={1.004}>
          <sphereGeometry args={[1, 64, 48]} />
        </mesh>
        <mesh material={glowMaterials.halo} scale={HALO_RADIUS}>
          <sphereGeometry args={[1, 64, 48]} />
        </mesh>

        {/* Message pulse: a thin ring that expands through the lime ring's plane, hidden at rest */}
        <group rotation={ACCENT_RING.tilt}>
          <mesh ref={shockwave} material={lines.wave} visible={false}>
            <torusGeometry args={[1, 0.006, 8, 256]} />
          </mesh>
        </group>

        {RINGS.map((ring, i) => (
          <group
            key={ring.radius}
            rotation={ring.tilt}
            ref={(node) => {
              rig.current.rings[i] = node
            }}
          >
            <mesh material={lines.rings[i]}>
              <torusGeometry args={[ring.radius, ring.accent ? 0.008 : 0.005, 10, 360]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
