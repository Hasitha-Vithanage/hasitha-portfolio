import { useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowUpRight, MousePointerClick, X } from 'lucide-react'
import { graph, type GraphNode } from '../../data/graph'
import { graphBridge, sceneInput, setSceneInput, subscribeSceneInput } from '../../components/three/sceneStore'
import { supportsWebGL } from '../../utils/webgl'
import { useTransitionTo } from '../../components/layout/pageTransition'

const HIT_RADIUS = 34

/** Index of the interactive graph node nearest a client position, or -1. */
function nodeAt(x: number, y: number): number {
  const screen = graphBridge.screen
  let best = -1
  let bestDistance = HIT_RADIUS
  for (let i = 0; i * 3 < screen.length; i++) {
    if (!screen[i * 3 + 2]) continue
    const distance = Math.hypot(screen[i * 3] - x, screen[i * 3 + 1] - y)
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  }
  return best
}

let releaseTimer: ReturnType<typeof setTimeout> | undefined

const focusNode = (id: string | null) => {
  clearTimeout(releaseTimer)
  releaseTimer = undefined
  if (sceneInput.focus !== id) setSceneInput({ focus: id })
}

/**
 * Clears focus after a short pause, so the pointer can cross the empty gap
 * between a discipline and its fanned-out skills without them folding away.
 */
const releaseFocus = () => {
  if (releaseTimer || sceneInput.focus === null) return
  releaseTimer = setTimeout(() => focusNode(null), 450)
}

const projects = graph.nodes.filter((n) => n.kind === 'project')
const groups = graph.nodes.filter((n) => n.kind === 'group')

function LegendLink({ node }: { node: GraphNode }) {
  const skills = node.skillCount ?? 0
  return (
    <Link
      to={node.href.startsWith('#') ? { hash: node.href } : node.href}
      onPointerEnter={() => focusNode(node.id)}
      onPointerLeave={() => focusNode(null)}
      onFocus={() => focusNode(node.id)}
      onBlur={() => focusNode(null)}
      className={`group/chip inline-flex min-h-10 items-center gap-2 rounded-full border bg-ink/90 px-4 text-sm transition-colors duration-300 ${
        node.kind === 'project'
          ? 'border-lime/30 text-lime hover:border-lime hover:bg-lime hover:text-ink focus-visible:bg-lime focus-visible:text-ink'
          : 'border-line-strong text-fg hover:border-fg/60 focus-visible:border-fg/60'
      }`}
    >
      {node.label}
      <span className="font-mono text-[0.65rem] opacity-60" aria-hidden="true">
        {skills}
      </span>
      <span className="sr-only">
        , {skills} {skills === 1 ? 'skill' : 'skills'}
      </span>
      {node.kind === 'project' && <ArrowUpRight className="size-3.5" aria-hidden="true" />}
    </Link>
  )
}

/**
 * A transparent window onto the WebGL skills graph. Pointer and touch input is
 * hit-tested against node positions published by the render loop; the legend
 * offers the same exploration to keyboard and screen-reader users.
 */
export function GraphStage() {
  const navigate = useNavigate()
  const transitionTo = useTransitionTo()
  const stage = useRef<HTMLDivElement>(null)
  const [webgl] = useState(supportsWebGL)

  const open = (node: GraphNode) => {
    if (node.href.startsWith('#')) void navigate({ hash: node.href })
    else transitionTo(node.href)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const index = nodeAt(event.clientX, event.clientY)
    if (index === -1) releaseFocus()
    else focusNode(graph.nodes[index].id)
    if (stage.current) stage.current.style.cursor = index === -1 ? '' : 'pointer'
  }

  // Mouse: click opens. Touch and pen: the first tap explores, a second tap opens.
  const onRelease = (event: PointerEvent<HTMLDivElement>) => {
    const index = nodeAt(event.clientX, event.clientY)
    if (index === -1) return focusNode(null)
    const node = graph.nodes[index]
    if (event.pointerType === 'mouse' || sceneInput.focus === node.id) open(node)
    else focusNode(node.id)
  }

  if (!webgl) {
    return (
      <div className="mt-16 md:mt-24">
        <Legend />
      </div>
    )
  }

  return (
    <div
      ref={stage}
      data-graph-stage
      onPointerMove={onPointerMove}
      onPointerLeave={() => focusNode(null)}
      onPointerUp={onRelease}
      className="relative mt-10 h-[100svh] min-h-[36rem] touch-pan-y select-none md:mt-16"
    >
      <p className="label absolute left-0 top-6 flex items-center gap-2 text-muted">
        <MousePointerClick className="size-3.5 text-lime" aria-hidden="true" />
        <span className="hidden md:inline">Hover a discipline or project to reveal the skills behind it · click to open</span>
        <span className="md:hidden">Tap to explore · tap again to open</span>
      </p>
      {/* The legend sits inside the stage, so focusing it never scrolls the graph out of view. */}
      <div
        className="absolute inset-x-0 bottom-0 pb-6 pt-16"
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
      >
        <StageFooter />
      </div>
    </div>
  )
}

const useFocusedNode = () => {
  const id = useSyncExternalStore(subscribeSceneInput, () => sceneInput.focus)
  return id ? graph.nodes.find((node) => node.id === id) : undefined
}

/**
 * Narrow screens: the graph has no room for skill labels, so the explored
 * node's skills are listed here, with an explicit way to open it.
 */
const RELATED_LABEL: Record<GraphNode['kind'], string> = { core: '', group: 'Skills', project: 'Demonstrates', skill: 'Part of' }

/** On narrow screens the panel takes the legend's place while a node is open, keeping the graph visible. */
function StageFooter() {
  const node = useFocusedNode()
  const open = node !== undefined && node.kind !== 'core'
  return (
    <>
      {open && <FocusPanel node={node} />}
      <div className={open ? 'hidden md:block' : undefined}>
        <Legend />
      </div>
    </>
  )
}

function FocusPanel({ node }: { node: GraphNode }) {
  const index = graph.nodes.indexOf(node)
  const related = graph.neighbours[index]
    .map((i) => graph.nodes[i])
    .filter((other) => (node.kind === 'skill' ? other.kind !== 'core' : other.kind === 'skill'))
  const relatedLabel = RELATED_LABEL[node.kind]

  return (
    <div className="mb-5 rounded-2xl border border-line-strong bg-surface p-4 md:hidden" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => focusNode(null)}
          className="-m-1 grid size-9 shrink-0 place-items-center rounded-full text-muted"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </button>
        <p className="mr-auto font-medium">{node.label}</p>
        <Link
          to={node.href.startsWith('#') ? { hash: node.href } : node.href}
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-lime px-3.5 text-sm font-medium text-ink"
        >
          Open <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      {related.length > 0 && (
        <>
          <p className="label mt-3 text-muted">{relatedLabel}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {related.map((other) => (
              <li key={other.id}>
                <button
                  type="button"
                  onClick={() => focusNode(other.id)}
                  className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-fg/85"
                >
                  {other.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Legend() {
  return (
    <nav aria-label="Explore projects and disciplines" className="grid gap-5 border-t border-line pt-6 md:grid-cols-12">
      <div className="md:col-span-5">
        <h3 className="label text-muted">Projects</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {projects.map((node) => (
            <li key={node.id}>
              <LegendLink node={node} />
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-7">
        <h3 className="label text-muted">Disciplines</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {groups.map((node) => (
            <li key={node.id}>
              <LegendLink node={node} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
