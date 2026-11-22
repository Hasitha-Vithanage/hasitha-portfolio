import { profile } from '../../data/profile'
import { Text } from '../../components/ui/Text'

export function Experience() {
  return (
    <div id="experience" className="mt-28 grid gap-14 border-t border-line pt-16 md:mt-36 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-7">
        <h3 className="text-3xl font-medium tracking-tight sm:text-4xl" data-reveal>
          Experience
        </h3>
        <ol className="relative mt-10 border-l border-line-strong">
          {profile.experience.map((entry, i) => (
            <li key={i} className="relative pb-12 pl-8 last:pb-0" data-reveal>
              <span
                aria-hidden="true"
                className={`absolute -left-[5px] top-2 size-[9px] rounded-full ${
                  entry.current ? 'bg-lime shadow-[0_0_0_4px_rgba(182,255,74,0.15)]' : 'border border-muted bg-ink'
                }`}
              />
              <p className="label text-muted">
                <Text value={entry.period} />
                {entry.current && <span className="ml-3 text-lime">Current</span>}
              </p>
              <h4 className="mt-3 text-xl font-medium">
                <Text value={entry.role} />
              </h4>
              <p className="mt-1 text-muted">
                <Text value={entry.organisation} />
              </p>
              <p className="mt-4 max-w-xl">
                <Text value={entry.summary} />
              </p>
              <ul className="mt-4 space-y-2 text-[0.95rem] text-muted">
                {entry.highlights.map((highlight, j) => (
                  <li key={j} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-lime" />
                    <span>
                      <Text value={highlight} />
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-12 md:col-span-4 md:col-start-9">
        <div data-reveal>
          <h3 className="text-3xl font-medium tracking-tight sm:text-4xl">Education</h3>
          <ul className="mt-8 space-y-6">
            {profile.education.map((entry, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface p-6">
                <p className="label text-muted">
                  <Text value={entry.period} />
                </p>
                <p className="mt-3 text-lg font-medium">
                  <Text value={entry.qualification} />
                </p>
                <p className="mt-1 text-muted">
                  <Text value={entry.institution} />
                </p>
              </li>
            ))}
          </ul>
        </div>

        {profile.certifications.length > 0 && (
          <div data-reveal>
            <h3 className="text-3xl font-medium tracking-tight sm:text-4xl">Certifications</h3>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {profile.certifications.map((cert, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                  <span className="font-medium">
                    <Text value={cert.name} />
                  </span>
                  <span className="text-sm text-muted">
                    <Text value={cert.issuer} /> · <Text value={cert.year} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
