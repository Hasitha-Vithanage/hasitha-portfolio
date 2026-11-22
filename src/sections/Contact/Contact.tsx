import type { ComponentType, SVGProps } from 'react'
import { ArrowUpRight, FileText, Mail } from 'lucide-react'
import { profile } from '../../data/profile'
import { isConfigured } from '../../utils/content'
import { GithubIcon, LinkedinIcon } from '../../components/ui/BrandIcons'
import { ContactForm } from './ContactForm'

interface Channel {
  label: string
  value: string
  href?: string
  newTab?: boolean
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const { email, github, linkedin, resume } = profile.links
const channels: Channel[] = [
  { label: 'Email', value: email, href: isConfigured(email) ? `mailto:${email}` : undefined, Icon: Mail },
  { label: 'GitHub', value: github, href: isConfigured(github) ? github : undefined, newTab: true, Icon: GithubIcon },
  { label: 'LinkedIn', value: linkedin, href: isConfigured(linkedin) ? linkedin : undefined, newTab: true, Icon: LinkedinIcon },
  { label: 'Résumé', value: resume, href: isConfigured(resume) ? resume : undefined, newTab: true, Icon: FileText },
]

const display = (value: string) => value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

function ChannelRow({ channel }: { channel: Channel }) {
  const { label, value, href, newTab, Icon } = channel
  const content = (
    <>
      <span className="flex items-center gap-4">
        <Icon className="size-5 text-muted transition-colors duration-300 group-hover:text-lime" aria-hidden="true" />
        <span className="text-xl font-medium sm:text-2xl">{label}</span>
      </span>
      <span className="flex min-w-0 items-center gap-3 text-right">
        {href ? (
          <span className="truncate font-mono text-sm text-muted">{label === 'Résumé' ? 'PDF' : display(value)}</span>
        ) : (
          <span className="placeholder truncate">{value}</span>
        )}
        {href && (
          <ArrowUpRight
            className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime"
            aria-hidden="true"
          />
        )}
      </span>
    </>
  )
  const row = 'group flex min-h-20 items-center justify-between gap-6 border-b border-line py-5'

  if (!href) return <div className={row}>{content}</div>
  return (
    <a href={href} className={row} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {content}
      {newTab && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  )
}

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      // No background of its own: the 3D scene behind the page returns here for the finale.
      className="relative z-10 overflow-hidden border-t border-line px-5 py-28 sm:px-8 md:py-40 lg:px-12"
    >
      <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-64 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(182,255,74,0.1),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[90rem]">
        <p className="label flex items-center gap-3 text-muted" data-reveal>
          <span className="text-lime">04</span>
          <span className="h-px w-10 bg-line-strong" aria-hidden="true" />
          Contact
        </p>
        <h2
          id="contact-title"
          className="mt-6 max-w-5xl text-[clamp(2.9rem,8vw,8rem)] font-medium leading-[0.92] tracking-[-0.045em]"
          data-reveal
        >
          Let’s build something <span className="text-lime">reliable.</span>
        </h2>
        <p className="mt-8 max-w-xl text-lg text-muted" data-reveal>
          If you have a project, an idea or a question, I’d be glad to hear from you.
        </p>

        <div className="mt-16 grid gap-14 md:mt-24 lg:grid-cols-12 lg:gap-10">
          <div className="border-t border-line lg:col-span-6" data-reveal>
            {channels.map((channel) => (
              <ChannelRow key={channel.label} channel={channel} />
            ))}
          </div>
          <div className="lg:col-span-5 lg:col-start-8" data-reveal>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}
