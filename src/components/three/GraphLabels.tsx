import { graph } from '../../data/graph'
import { graphBridge } from './sceneStore'

/**
 * One label per graph node. The render loop positions them and sets their
 * opacity directly, so they never cause React re-renders. Decorative only:
 * the same information is available as links in the legend below the graph.
 */
export function GraphLabels() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {graph.nodes.map((node, i) => (
        <span
          key={node.id}
          ref={(el) => {
            graphBridge.labels[i] = el
          }}
          data-kind={node.kind}
          className="graph-label absolute left-0 top-0 opacity-0 will-change-transform"
        >
          <span className="graph-label__text">{node.label}</span>
        </span>
      ))}
    </div>
  )
}
