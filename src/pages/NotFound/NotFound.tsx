import { ArrowLeft } from 'lucide-react'
import { usePageMeta } from '../../hooks/usePageMeta'
import { ButtonLink } from '../../components/ui/Button'

export default function NotFound() {
  usePageMeta('Page not found')
  return (
    <section
      id="top"
      aria-labelledby="not-found-title"
      className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 pt-24 text-center"
    >
      <div
        className="grid-lines absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent_65%)]"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="label text-lime">Error 404</p>
        <h1 id="not-found-title" className="mt-6 text-[clamp(3rem,10vw,9rem)] font-medium leading-[0.9] tracking-[-0.05em]">
          Signal lost.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-muted">
          The page you were looking for doesn’t exist or has moved.
        </p>
        <div className="mt-10 flex justify-center">
          <ButtonLink to="/">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
