import { lines } from '../helpers.tsx'

const BRANDS =
  'Apple, Airbnb, Ambush, Peggy Gou, Xbox, Nike,\n' +
  'YouTube, Google, Microsoft, Samsung, Anduril,\n' +
  'Expa, One Plus, Lufthansa, Corvette, HBO,\n' +
  'Shell, Cartoon Network, Discovery Kids.'

export default function About() {
  return (
    <section className="about">
      <div className="about__introduction">
        <p data-gl-text="">
          {lines([
            'Creative Technologist specialized in crafting',
            'cutting-edge real-time 3D experiences using',
            'WebGPU, WebGL, Shaders and TypeScript.',
          ])}
        </p>

        <p data-gl-text="">
          {lines([
            'Over a decade of experience in the industry',
            'of creative development working with projects',
            'across diverse mediums, including websites,',
            'games, interactive installations and apps.',
          ])}
        </p>

        <p data-gl-text="">
          Currently building{' '}
          <a href="https://interactive.dev/" rel="noopener" target="_blank">
            Interactive Development
          </a>
          .
        </p>
      </div>

      <div className="about__content">
        <div className="about__content__column">
          <div className="about__information">
            <p className="about__information__column" data-gl-text="">
              <a className="about__information__link" href="mailto:luis@bizar.ro">
                Business Inquiries
              </a>
            </p>

            <p className="about__information__column" data-gl-text="">
              <a className="about__information__link" href="https://github.com/bizarro/" rel="noopener" target="_blank">
                GitHub
              </a>
              <br />
              {'\n'}
              <a
                className="about__information__link"
                href="https://instagram.com/bizarro/"
                rel="noopener"
                target="_blank"
              >
                Instagram
              </a>
              <br />
              {'\n'}
              <a
                className="about__information__link"
                href="https://linkedin.com/in/luis-bizarro/"
                rel="noopener"
                target="_blank"
              >
                LinkedIn
              </a>
              <br />
              {'\n'}
              <a className="about__information__link" href="https://x.com/LuisBizarro/" rel="noopener" target="_blank">
                Twitter
              </a>
            </p>

            <p className="about__information__column" data-gl-text="">
              {lines(['18th September, 1995', 'São Paulo', 'Brazil', '', '23.5742754° S', '46.6388007° W'])}
            </p>
          </div>

          <a className="about__credits" data-gl-text="" href="https://kacper.ch/" rel="noopener" target="_blank">
            Design by Kacper
          </a>
        </div>

        <div className="about__content__column">
          <figure className="about__media">
            <img alt="Luis Bizarro" className="about__media__image" data-gl-media="/shared/photo.webp" />
          </figure>

          <div className="about__brands">
            <h2 className="about__brands__title" data-gl-text="">
              Brands:
            </h2>

            <p className="about__brands__description" data-gl-text="">
              {BRANDS}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
