import { isPlaceholder } from '../../utils/content'

/**
 * Renders a content string, marking placeholders like "[Add company]"
 * so unfinished content is easy to spot.
 */
export function Text({ value }: { value: string }) {
  if (!isPlaceholder(value)) return <>{value}</>
  return (
    <span className="placeholder" title="Placeholder — replace in src/data">
      {value}
    </span>
  )
}
