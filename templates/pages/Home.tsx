import projects from '../data/projects.ts'
import About from '../sections/About.tsx'
import Header from '../sections/Header.tsx'
import Project from '../sections/Project.tsx'
import Head from '../shared/Head.tsx'
import Scripts from '../shared/Scripts.tsx'

interface HomeProps {
  isPhone: boolean
  isTablet: boolean
}

export default function Home({ isPhone, isTablet }: HomeProps) {
  const deviceClass = isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop'

  return (
    <html className={deviceClass} lang="en">
      <head>
        <Head />
      </head>

      <body>
        <div className="app" id="content" data-template="home">
          <main className="home">
            <div className="home__wrapper">
              <Header />
              <About />

              <section className="projects">
                {projects.map((project) => (
                  <Project key={project.link} {...project} />
                ))}
              </section>
            </div>
          </main>
        </div>

        <Scripts />
      </body>
    </html>
  )
}
