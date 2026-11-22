import { profile } from './profile'
import { projects, type ProjectSlug } from './projects'
import { capabilityGroups } from './skills'

/**
 * The interactive skills graph, derived from the project and skills data:
 * you → disciplines → skills → the projects that demonstrate them.
 * Nothing here is written by hand, so the graph always matches the content.
 */

export type GraphNodeKind = 'core' | 'group' | 'skill' | 'project'

export interface GraphNode {
  id: string
  kind: GraphNodeKind
  label: string
  /** In-page anchor or route the node opens. */
  href: string
  groupId?: string
  slug?: ProjectSlug
  /** For skills: index of the discipline node they belong to. */
  parent?: number
  /** For disciplines and projects: how many skills sit behind them. */
  skillCount?: number
}

/**
 * - structure: you → discipline (always shown)
 * - summary:   discipline → project, derived from its skills (always shown)
 * - detail:    discipline → skill and skill → project (shown when a node is explored)
 */
export type GraphLinkKind = 'structure' | 'summary' | 'detail'

export interface Graph {
  nodes: GraphNode[]
  links: [number, number][]
  linkKinds: GraphLinkKind[]
  /** Indexes of directly connected nodes, per node. */
  neighbours: number[][]
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const skillAnchor = (groupId: string, name: string) => `skill-${groupId}-${slugify(name)}`

export function buildGraph(): Graph {
  const nodes: GraphNode[] = [{ id: 'core', kind: 'core', label: profile.name, href: '#about' }]
  const links: [number, number][] = []
  const linkKinds: GraphLinkKind[] = []
  const link = (a: number, b: number, kind: GraphLinkKind) => {
    links.push([a, b])
    linkKinds.push(kind)
  }
  const indexOf = new Map<string, number>()
  const add = (node: GraphNode) => {
    indexOf.set(node.id, nodes.length)
    nodes.push(node)
    return nodes.length - 1
  }

  for (const project of projects) {
    add({
      id: `project:${project.slug}`,
      kind: 'project',
      label: project.title,
      href: `/projects/${project.slug}`,
      slug: project.slug,
      skillCount: 0,
    })
  }

  for (const group of capabilityGroups) {
    const groupIndex = add({
      id: `group:${group.id}`,
      kind: 'group',
      label: group.title,
      href: `#cap-${group.id}`,
      groupId: group.id,
      skillCount: group.items.length,
    })
    link(0, groupIndex, 'structure')
    const demonstrated = new Set<number>()
    for (const item of group.items) {
      const skillIndex = add({
        id: `skill:${group.id}:${slugify(item.name)}`,
        kind: 'skill',
        label: item.name,
        href: `#${skillAnchor(group.id, item.name)}`,
        groupId: group.id,
        parent: groupIndex,
      })
      link(groupIndex, skillIndex, 'detail')
      for (const slug of item.projects ?? []) {
        const projectIndex = indexOf.get(`project:${slug}`)
        if (projectIndex === undefined) continue
        link(skillIndex, projectIndex, 'detail')
        demonstrated.add(projectIndex)
        nodes[projectIndex].skillCount! += 1
      }
    }
    demonstrated.forEach((projectIndex) => link(groupIndex, projectIndex, 'summary'))
  }

  const neighbours = nodes.map(() => [] as number[])
  for (const [a, b] of links) {
    neighbours[a].push(b)
    neighbours[b].push(a)
  }

  return { nodes, links, linkKinds, neighbours }
}

export const graph = buildGraph()
