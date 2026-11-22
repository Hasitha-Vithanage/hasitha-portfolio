import { profile } from '../../data/profile'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { Text } from '../../components/ui/Text'
import { Experience } from './Experience'

export function About() {
  const { about } = profile
  return (
    <section id="about" aria-labelledby="about-title" className="relative z-10 bg-ink px-5 py-28 sm:px-8 md:py-40 lg:px-12">
      <div className="mx-auto max-w-[90rem]">
        <SectionHeading id="about-title" index="03" label="About" title="A practical engineering mindset." />

        <div className="mt-16 grid gap-14 md:mt-24 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <p className="text-[clamp(1.4rem,2.3vw,2rem)] leading-[1.35] tracking-[-0.015em]" data-reveal>
              {about.lead}
            </p>
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-6 max-w-2xl text-muted" data-reveal>
                {paragraph}
              </p>
            ))}

            <div className="mt-12" data-reveal>
              <h3 className="label text-muted">Interests</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {about.interests.map((interest) => (
                  <li key={interest} className="rounded-full border border-line px-3.5 py-1.5 text-sm">
                    {interest}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <h3 className="label text-muted" data-reveal>
              How I work
            </h3>
            <ol className="mt-4 border-t border-line">
              {about.principles.map((principle, i) => (
                <li key={principle.title} className="grid grid-cols-[2.5rem_1fr] border-b border-line py-5" data-reveal>
                  <span className="label pt-1 text-lime">0{i + 1}</span>
                  <div>
                    <p className="font-medium">{principle.title}</p>
                    <p className="mt-1.5 text-[0.95rem] text-muted">{principle.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="label mt-8 text-muted" data-reveal>
              Location — <Text value={profile.location} />
            </p>
          </div>
        </div>

        <Experience />
      </div>
    </section>
  )
}
