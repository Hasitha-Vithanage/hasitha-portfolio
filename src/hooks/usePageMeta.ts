import { useEffect } from 'react'
import { profile } from '../data/profile'

const DEFAULT_TITLE = `${profile.name} — Full-Stack Software Engineer`

/** Sets the document title and meta description for the current route. */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${profile.name}` : DEFAULT_TITLE
    if (!description) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) return
    const previous = meta.content
    meta.content = description
    return () => {
      meta.content = previous
    }
  }, [title, description])
}
