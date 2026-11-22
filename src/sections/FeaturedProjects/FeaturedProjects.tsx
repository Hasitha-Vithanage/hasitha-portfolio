import { projects } from '../../data/projects'
import { ProjectCard } from '../../components/projects/ProjectCard'
import { SectionHeading } from '../../components/ui/SectionHeading'

export function FeaturedProjects() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative px-5 py-28 sm:px-8 md:py-40 lg:px-12">
      <div className="mx-auto max-w-[90rem]">
        <SectionHeading
          id="work-title"
          index="01"
          label="Selected work"
          title={
            <>
              Software, built
              <br className="hidden sm:block" /> and verified.
            </>
          }
          intro="Case studies covering full-stack application development, a self-built productivity tool, and the interactive build of this site."
        />

        <div className="mt-20 flex flex-col gap-24 md:mt-28 md:gap-36">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
