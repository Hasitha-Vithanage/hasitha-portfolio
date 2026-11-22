import { Color, MeshPhysicalMaterial } from 'three'

/**
 * Engineered panel plating, computed in the shader from object-space position:
 * the sphere is treated as an inflated cube, each face divided into a grid of
 * panels. Grooves only absorb light (darker metal, no clear coat) and keep the
 * surface's roughness: rougher grooves would reflect a blurred, brighter average
 * and show as light lines across the dark metal. As it is, they vanish in shadow
 * and only cut through the bright reflections — like a machined part.
 */
const PANEL_GLSL = /* glsl */ `
  varying vec3 vPanelPosition;
  uniform float uPanels;

  float panelHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // x: groove strength (0 → 1), y: per-panel variation (0 → 1)
  vec2 panelPattern(vec3 p) {
    vec3 a = abs(p);
    vec2 uv;
    float face;
    if (a.x >= a.y && a.x >= a.z) { uv = p.yz / a.x; face = sign(p.x); }
    else if (a.y >= a.z) { uv = p.xz / a.y; face = 2.0 + sign(p.y); }
    else { uv = p.xy / a.z; face = 4.0 + sign(p.z); }
    // Even out panel sizes across each face (equal-angle cube mapping).
    uv = atan(uv) * 1.27323954;
    vec2 cell = uv * uPanels;
    vec2 toLine = 0.5 - abs(fract(cell) - 0.5);
    // At least ~1px wide with soft edges, so the lines stay stable in motion.
    vec2 width = max(vec2(0.014), fwidth(cell) * 0.75);
    vec2 line = 1.0 - smoothstep(width, width * 2.0, toLine);
    return vec2(max(line.x, line.y), panelHash(floor(cell) + face * 17.0));
  }
`

/**
 * Scan sweep: a band of light that travels down the sphere, lighting the grooves
 * it crosses and leaving a short afterglow. `progress` runs 0 → 1; at 1 it is off.
 */
const SCAN_GLSL = /* glsl */ `
  float bandCentre = mix(1.25, -1.25, uScan);
  vec3 scanNormal = normalize(vPanelPosition);
  float toBand = scanNormal.y - bandCentre;
  // (Inverted smoothsteps: edge0 must stay below edge1.)
  float band = 1.0 - smoothstep(0.0, 0.16, abs(toBand));
  float afterglow = step(0.0, toBand) * (1.0 - smoothstep(0.0, 0.8, toBand));
  float scanLight = (band * (0.25 + groove * 2.2) + afterglow * groove * 0.7) * step(uScan, 0.999);
  totalEmissiveRadiance += uScanColor * scanLight;
`

export interface PanelScan {
  progress: { value: number }
  color: { value: Color }
}

export function createPanelMaterial() {
  const scan: PanelScan = { progress: { value: 1 }, color: { value: new Color('#B6FF4A') } }
  const material = new MeshPhysicalMaterial({
    color: '#e9edf2',
    metalness: 1,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPanels = { value: 4 }
    shader.uniforms.uScan = scan.progress
    shader.uniforms.uScanColor = scan.color

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPanelPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPanelPosition = position;')

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${PANEL_GLSL}\nuniform float uScan;\nuniform vec3 uScanColor;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec2 panel = panelPattern(normalize(vPanelPosition));
        float groove = panel.x;
        diffuseColor.rgb *= 1.0 - groove * 0.75;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        // A barely-there difference between panels, only noticeable as a highlight crosses them.
        roughnessFactor += (panel.y - 0.5) * 0.03;`,
      )
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${SCAN_GLSL}`)
      .replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
          material.clearcoat *= 1.0 - groove;
        #endif`,
      )
  }
  material.customProgramCacheKey = () => 'panel-plating'

  return Object.assign(material, { scan })
}
