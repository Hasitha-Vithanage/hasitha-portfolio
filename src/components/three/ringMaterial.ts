import { Color, ShaderMaterial } from 'three'

/**
 * Material for a torus that can be partially drawn: `uProgress` reveals the ring
 * around its circumference from `uStart`, with a bright head while it is drawing.
 * Once fully drawn it renders as a plain, evenly lit line.
 */
export function createRingMaterial(color: Color, opacity: number, start: number) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      uProgress: { value: 1 },
      uStart: { value: start },
    },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uProgress;
      uniform float uStart;
      varying vec2 vLocal;
      const float TAU = 6.28318530718;
      void main() {
        // Position around the ring, 0 → 1, measured from the starting angle.
        float around = fract(atan(vLocal.y, vLocal.x) / TAU + 0.5 - uStart);
        if (around > uProgress) discard;
        // A short bright head at the drawing edge, gone once the ring is complete.
        float head = smoothstep(uProgress - 0.06, uProgress, around) * step(uProgress, 0.999);
        gl_FragColor = vec4(uColor * (1.0 + head * 2.5), uOpacity);
        #include <colorspace_fragment>
      }
    `,
  })
}
