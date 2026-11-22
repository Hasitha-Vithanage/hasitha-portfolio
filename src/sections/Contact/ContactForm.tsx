import { useId, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { profile } from '../../data/profile'
import { isConfigured } from '../../utils/content'
import { sceneInput, setSceneInput } from '../../components/three/sceneStore'

type Status =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'sent' }
  | { state: 'handoff' }
  | { state: 'error'; message: string }

const endpoint = import.meta.env.VITE_FORM_ENDPOINT?.trim()

/** Sends a pulse across the 3D scene's rings behind the form: the finale's response to a message. */
const sendSignal = () => setSceneInput({ signal: sceneInput.signal + 1 })

/**
 * Sends through a form service when VITE_FORM_ENDPOINT is configured.
 * Otherwise it hands the message to the visitor's email app — and says so,
 * rather than claiming the message was sent.
 */
export function ContactForm() {
  const id = useId()
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const email = profile.links.email
  const mode = endpoint ? 'service' : isConfigured(email) ? 'mailto' : 'unconfigured'
  const disabled = mode === 'unconfigured' || status.state === 'sending'

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    if (data._gotcha) return

    if (mode === 'mailto') {
      const subject = encodeURIComponent(`Portfolio enquiry from ${data.name}`)
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`)
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
      setStatus({ state: 'handoff' })
      sendSignal()
      return
    }

    setStatus({ state: 'sending' })
    try {
      const response = await fetch(endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
          // Subject line of the notification email (Formspree and similar services read this field).
          _subject: `Portfolio enquiry from ${data.name}`,
        }),
      })
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
      form.reset()
      setStatus({ state: 'sent' })
      sendSignal()
    } catch {
      setStatus({
        state: 'error',
        message: 'Your message could not be sent. Please try again, or use the email link instead.',
      })
    }
  }

  const field =
    'mt-2 w-full rounded-xl border border-line-strong bg-ink/60 px-4 py-3.5 text-fg placeholder:text-muted/60 transition-colors focus:border-lime focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-describedby={`${id}-note`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input name="name" required autoComplete="name" disabled={disabled} className={field} />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" disabled={disabled} className={field} />
        </label>
      </div>
      <label className="mt-5 block text-sm font-medium">
        Message
        <textarea name="message" required rows={5} disabled={disabled} className={`${field} resize-y`} />
      </label>
      {/* Spam trap, hidden from people */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p id={`${id}-note`} className="max-w-xs text-sm text-muted">
          {mode === 'service' && 'Messages are delivered straight to my inbox.'}
          {mode === 'mailto' && 'Opens your email app with the message ready to send.'}
          {mode === 'unconfigured' && (
            <span className="placeholder">[Configure VITE_FORM_ENDPOINT or add an email address to enable this form]</span>
          )}
        </p>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-lime px-6 font-medium text-ink transition-colors duration-300 hover:bg-fg disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted"
        >
          {status.state === 'sending' ? 'Sending…' : 'Send message'}
          <Send className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm empty:hidden">
        {status.state === 'sent' && <span className="text-lime">Thank you — your message has been sent.</span>}
        {status.state === 'handoff' && (
          <span className="text-muted">
            Your email app should now be open with the message. If nothing happened, write to {email} directly.
          </span>
        )}
        {status.state === 'error' && <span className="text-red-300">{status.message}</span>}
      </p>
    </form>
  )
}
