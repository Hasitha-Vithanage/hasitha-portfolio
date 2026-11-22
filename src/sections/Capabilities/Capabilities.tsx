import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { capabilityGroups, type CapabilityGroup } from '../../data/skills'
import { getProject } from '../../data/projects'
import { skillAnchor } from '../../data/graph'
import { GraphStage } from './GraphStage'
import { SectionHeading } from '../../components/ui/SectionHeading'
import { Text } from '../../components/ui/Text'

function GroupCard({ group }: { group: CapabilityGroup }) {
  return (
    <article
      aria-labelledby={`cap-${group.id}`}
      className="group/card relative flex flex-col rounded-2xl border border-line bg-surface p-6 transition-colors duration-500 hover:border-line-strong sm:p-8"
      data-reveal
    >
      <div className="flex items-start justify-between gap-4">
        <span className="label text-lime">{group.index}</span>
        {group.learning && (
          <span className="label rounded-full border border-line-strong px-2.5 py-1 text-[0.6rem] text-muted">Currently learning</span>
        )}
      </div>
      <h3 id={`cap-${group.id}`} className="mt-8 text-2xl font-medium tracking-tight sm:text-[1.75rem]">
        {group.title}
      </h3>
      <p className="mt-3 text-muted">{group.summary}</p>

      <ul className="mt-8 divide-y divide-line border-t border-line">
        {group.items.map((item) => (
          <li
            key={item.name}
            id={skillAnchor(group.id, item.name)}
            className="grid scroll-mt-28 gap-1 rounded-md py-4 transition-colors duration-700 target:bg-lime/5 focus:bg-lime/5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-6"
          >
            <span className="font-medium">{item.name}</span>
            <span className="text-[0.95rem] text-muted">
              <Text value={item.detail} />
              {item.projects?.map((slug) => {
                const project = getProject(slug)
                if (!project) return null
                return (
                  <Link
                    key={slug}
                    to={`/projects/${slug}`}
                    className="ml-2 inline-flex items-center gap-0.5 whitespace-nowrap font-mono text-xs text-lime/90 hover:text-lime"
                  >
                    {project.title}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </Link>
                )
              })}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function Capabilities() {
  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-title"
      className="relative px-5 py-28 sm:px-8 md:py-40 lg:px-12"
    >
      <div className="mx-auto max-w-[90rem]">
        <SectionHeading
          id="capabilities-title"
          index="02"
          label="Engineering capabilities"
          title={
            <>
              Connected skills,
              <br className="hidden sm:block" /> not percentages.
            </>
          }
          intro="A live map of how my skills connect to the work that demonstrates them. Explore it below, or read the full breakdown."
        />

        <GraphStage />

        <div className="mt-20 grid gap-5 md:mt-28 lg:grid-cols-2">
          {capabilityGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>
    </section>
  )
}
