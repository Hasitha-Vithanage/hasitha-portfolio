import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector3 } from 'three'
import { CAMERA_DISTANCE, mix } from './layout'
import { introStages } from './intro'
import { blastAt, graphBridge, implodeAt, type SceneMotion } from './sceneStore'

/** Volume the dust fills, in world units around the origin. Deep in z, so camera moves reveal parallax. */
const BOUNDS = { x: 9, y: 6, zNear: 4, zFar: -8 }
/** Share of specks tinted lime; the rest are cool grey. */
const LIME_SHARE = 0.12
const GREY = new Color('#9AA4B2')
const LIME = new Color('#B6FF4A')

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  // Supernova: specks are drawn toward uOrigin as the project implodes, then blasted away from it.
  uniform vec3 uOrigin;
  uniform float uImplode;
  uniform float uBlast;
  attribute vec3 aColor;
  attribute vec2 aData; // size, seed
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float seed = aData.y;
    // A slow, individual drift, so the field feels suspended rather than fixed.
    vec3 p = position + vec3(
      sin(uTime * 0.11 + seed * 31.0),
      cos(uTime * 0.09 + seed * 17.0),
      sin(uTime * 0.07 + seed * 23.0)
    ) * 0.25;
    vec3 fromOrigin = p - uOrigin;
    p -= fromOrigin * uImplode * 0.3;
    p += normalize(fromOrigin + vec3(1e-4)) * uBlast * (6.0 + seed * 6.0);

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    float depth = -viewPosition.z;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = min(aData.x * uPixelRatio * (${CAMERA_DISTANCE.toFixed(1)} / max(depth, 0.1)), 8.0 * uPixelRatio);

    // Fade out specks close to the camera (they would read as blurry blobs) and far away.
    float near = smoothstep(2.0, 5.0, depth);
    float far = 1.0 - smoothstep(16.0, 22.0, depth);
    float twinkle = 0.7 + 0.3 * sin(uTime * 0.8 + seed * 50.0);
    vColor = aColor;
    // Heated as they fall in, fading as they're blown out.
    vAlpha = near * far * twinkle * (1.0 + uImplode * 1.5) * (1.0 - uBlast * 0.85);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft round speck. (Inverted smoothstep: edge0 must stay below edge1.)
    float falloff = 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - 0.5));
    float alpha = falloff * vAlpha * uIntensity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vColor * alpha, alpha);
  }
`

function buildGeometry(count: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const data = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * BOUNDS.x
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * BOUNDS.y
    positions[i * 3 + 2] = mix(BOUNDS.zFar, BOUNDS.zNear, Math.random())
    const color = Math.random() < LIME_SHARE ? LIME : GREY
    // Kept below bloom's threshold (0.9), so the dust never glows.
    const brightness = 0.45 + Math.random() * 0.5
    colors[i * 3] = color.r * brightness
    colors[i * 3 + 1] = color.g * brightness
    colors[i * 3 + 2] = color.b * brightness
    data[i * 2] = 1.8 + Math.random() ** 2 * 4
    data[i * 2 + 1] = Math.random()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
  geometry.setAttribute('aData', new BufferAttribute(data, 2))
  return geometry
}

interface DustProps {
  motion: RefObject<SceneMotion>
  /** Fewer specks on small screens. */
  compact: boolean
}

/**
 * A sparse field of faint specks at many depths around the scene. They sit
 * still in world space, so the camera's pointer parallax and scroll swing move
 * near and far specks at different speeds, which is what gives the depth.
 */
export function Dust({ motion, compact }: DustProps) {
  const count = compact ? 220 : 520
  const geometry = useMemo(() => buildGeometry(count), [count])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uIntensity: { value: 0 },
          uOrigin: { value: new Vector3() },
          uImplode: { value: 0 },
          uBlast: { value: 0 },
        },
      }),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const m = motion.current
    const u = material.uniforms
    u.uTime.value = m.time
    u.uPixelRatio.value = state.viewport.dpr
    // Fades in with the opening sequence, and steps back while the graph is formed so it never competes with the labels.
    u.uIntensity.value = introStages(m.intro).sphere * mix(1, 0.75, m.network)

    const flying = m.fly > 0 && graphBridge.hasFlightTarget
    u.uImplode.value = flying ? implodeAt(m.fly) : 0
    u.uBlast.value = flying ? blastAt(m.fly) : 0
    if (flying) u.uOrigin.value.set(graphBridge.flightTarget.x, graphBridge.flightTarget.y, graphBridge.flightTarget.z)
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
