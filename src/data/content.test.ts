import { describe, expect, it } from 'vitest'
import { getProject, projects } from './projects'
import { capabilityGroups } from './skills'
import { isConfigured, isExternalUrl, isPlaceholder } from '../utils/content'
import { CAMERA_DISTANCE, cameraShot, coreTransform, layoutGraph } from '../components/three/layout'
import { graph, skillAnchor } from './graph'

describe('placeholder detection', () => {
  it('recognises bracketed placeholders', () => {
    expect(isPlaceholder('[Add LinkedIn URL]')).toBe(true)
    expect(isPlaceholder('  [Add company]  ')).toBe(true)
  })

  it('does not flag real values', () => {
    expect(isPlaceholder('https://github.com/someone')).toBe(false)
    expect(isPlaceholder('Uses [brackets] inside')).toBe(false)
  })

  it('treats empty and placeholder values as unconfigured', () => {
    expect(isConfigured('')).toBe(false)
    expect(isConfigured(undefined)).toBe(false)
    expect(isConfigured('[Add email address]')).toBe(false)
    expect(isConfigured('/Hasitha_Vithanage.pdf')).toBe(true)
  })

  it('distinguishes external from internal links', () => {
    expect(isExternalUrl('https://example.com')).toBe(true)
    expect(isExternalUrl('mailto:someone@example.com')).toBe(true)
    expect(isExternalUrl('/projects/3d-portfolio')).toBe(false)
  })
})

describe('project content', () => {
  it('has unique slugs and indexes', () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length)
    expect(new Set(projects.map((p) => p.index)).size).toBe(projects.length)
  })

  it('has unique section ids within each case study', () => {
    for (const project of projects) {
      const ids = project.sections.map((s) => s.id)
      expect(new Set(ids).size, project.slug).toBe(ids.length)
      expect(ids, project.slug).not.toContain('screenshots')
    }
  })

  it('points every screenshot at a file in /public', () => {
    const files = new Set(Object.keys(import.meta.glob('/public/**/*.{png,jpg,jpeg,webp,avif}')).map((path) => path.slice('/public'.length)))
    for (const project of projects) {
      for (const shot of project.screenshots) {
        if (shot.src) expect(files.has(shot.src), shot.src).toBe(true)
      }
    }
  })

  it('resolves projects by slug only', () => {
    expect(getProject('3d-portfolio')?.title).toBe('Interactive 3D Portfolio')
    expect(getProject('missing')).toBeUndefined()
    expect(getProject(undefined)).toBeUndefined()
  })

  it('links every capability to an existing project', () => {
    for (const group of capabilityGroups) {
      for (const item of group.items) {
        for (const slug of item.projects ?? []) {
          expect(getProject(slug), `${item.name} → ${slug}`).toBeDefined()
        }
      }
    }
  })
})

describe('skills graph', () => {
  it('has one node per project, discipline and skill, plus the core', () => {
    const skills = capabilityGroups.reduce((sum, group) => sum + group.items.length, 0)
    expect(graph.nodes).toHaveLength(1 + projects.length + capabilityGroups.length + skills)
    expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(graph.nodes.length)
  })

  it('only links existing nodes, without duplicates', () => {
    const seen = new Set<string>()
    for (const [a, b] of graph.links) {
      expect(graph.nodes[a]).toBeDefined()
      expect(graph.nodes[b]).toBeDefined()
      expect(seen.has(`${a}:${b}`)).toBe(false)
      seen.add(`${a}:${b}`)
    }
  })

  it('connects every node to the rest of the graph', () => {
    graph.neighbours.forEach((list, i) => expect(list.length, graph.nodes[i].id).toBeGreaterThan(0))
  })

  it('links skills to the projects named in the skills data', () => {
    const typescript = graph.nodes.findIndex((n) => n.id === 'skill:development:typescript-javascript')
    const portfolio = graph.nodes.findIndex((n) => n.id === 'project:3d-portfolio')
    expect(graph.neighbours[typescript]).toContain(portfolio)
  })

  it('keeps the resting graph to the main structure', () => {
    graph.links.forEach(([a, b], i) => {
      const kinds = [graph.nodes[a].kind, graph.nodes[b].kind]
      // Every link that touches a skill is detail, revealed only while exploring.
      expect(graph.linkKinds[i] === 'detail', kinds.join('→')).toBe(kinds.includes('skill'))
    })
    expect(graph.links).toHaveLength(graph.linkKinds.length)
  })

  it('links a discipline to a project exactly when one of its skills demonstrates it', () => {
    const development = graph.nodes.findIndex((n) => n.id === 'group:development')
    const gym = graph.nodes.findIndex((n) => n.id === 'project:gym-management')
    const quality = graph.nodes.findIndex((n) => n.id === 'group:quality')
    expect(graph.neighbours[development]).toContain(gym)
    expect(graph.neighbours[quality].filter((i) => graph.nodes[i].kind === 'project')).toHaveLength(0)
  })

  it('leaves hidden capability groups off the site', () => {
    expect(capabilityGroups.map((g) => g.id)).not.toContain('security')
    expect(graph.nodes.some((n) => n.id === 'group:security')).toBe(false)
  })

  it('counts the skills behind each project and discipline', () => {
    const gym = graph.nodes.find((n) => n.id === 'project:gym-management')
    expect(gym?.skillCount).toBe(3)
    for (const group of capabilityGroups) {
      expect(graph.nodes.find((n) => n.id === `group:${group.id}`)?.skillCount).toBe(group.items.length)
    }
  })

  it('points every node at a route or an anchor that exists', () => {
    const anchors = new Set([
      'about',
      ...capabilityGroups.map((g) => `cap-${g.id}`),
      ...capabilityGroups.flatMap((g) => g.items.map((item) => skillAnchor(g.id, item.name))),
    ])
    for (const node of graph.nodes) {
      if (node.href.startsWith('#')) expect(anchors.has(node.href.slice(1)), node.id).toBe(true)
      else expect(getProject(node.href.replace('/projects/', '')), node.id).toBeDefined()
    }
  })

  it('places every node inside the normalised layout area', () => {
    const placements = layoutGraph(graph)
    expect(placements).toHaveLength(graph.nodes.length)
    for (const { target } of placements) {
      expect(Math.abs(target[0])).toBeLessThanOrEqual(1)
      expect(Math.abs(target[1])).toBeLessThanOrEqual(1)
    }
  })
})

describe('scene layout', () => {
  it('frames the hero and the graph exactly as at rest, and only moves the camera in between', () => {
    const viewport = { width: 8.96, height: 5.04 }
    for (const [hero, network] of [
      [0, 0],
      [1, 1],
    ]) {
      const shot = cameraShot(viewport, hero, network)
      shot.target.forEach((value) => expect(value).toBeCloseTo(0))
      expect(shot.azimuth).toBe(0)
      expect(shot.distance).toBe(CAMERA_DISTANCE)
    }
    const between = cameraShot(viewport, 1, 0)
    expect(between.azimuth).toBeGreaterThan(0)
    expect(between.distance).toBeGreaterThan(CAMERA_DISTANCE)
  })

  it('keeps the core on screen at every scroll state', () => {
    for (const viewport of [
      { width: 8.96, height: 5.04 },
      { width: 2.33, height: 5.04 },
    ]) {
      for (const t of [0, 0.5, 1]) {
        const { position, scale } = coreTransform(viewport, t)
        expect(Math.abs(position[0])).toBeLessThan(viewport.width / 2)
        expect(Math.abs(position[1])).toBeLessThan(viewport.height / 2)
        expect(scale).toBeGreaterThan(0)
      }
    }
  })
})
