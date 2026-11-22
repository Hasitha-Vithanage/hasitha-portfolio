import { createContext, useContext } from 'react'

/**
 * Navigates to another page through the page transition: the current page
 * fades out before the route changes. Links are handled automatically; this is
 * for navigation started in code, such as clicking a node in the skills graph.
 */
export type TransitionTo = (to: string) => void

export const PageTransitionContext = createContext<TransitionTo | null>(null)

export function useTransitionTo(): TransitionTo {
  const transitionTo = useContext(PageTransitionContext)
  if (!transitionTo) throw new Error('useTransitionTo must be used inside Layout')
  return transitionTo
}
