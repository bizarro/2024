import type { ProjectData } from '../data/projects.ts'
import { lines } from '../helpers.tsx'

export default function Project({ description, information, link, media, mediaModifier, title }: ProjectData) {
  const mediaClass = `project__media${mediaModifier ? ` project__media--${mediaModifier}` : ''}`

  return (
    <section className="project">
      <header className="project__header" data-gl-background="">
        <div className="project__header__content">
          <p className="project__header__information" data-gl-text="uppercase">
            {information}
          </p>

          <h3 className="project__header__title" data-gl-text="uppercase">
            {lines(title)}
          </h3>

          <p className="project__header__description" data-gl-text="">
            {lines(description)}
          </p>
        </div>

        <a className="project__header__link" data-gl-background-line="" href={link} rel="noopener" target="_blank">
          <span className="project__header__link__text" data-gl-text="uppercase">
            See ✦
          </span>
        </a>
      </header>

      <div className="project__content">
        {media.map(({ src, type }) => (
          <figure className={mediaClass} key={src}>
            {type === 'video' ? (
              <video
                autoplay
                className="project__media__image"
                crossorigin="anonymous"
                data-gl-media={src}
                loop
                muted
                playsinline
              ></video>
            ) : (
              <img alt="" className="project__media__image" crossorigin="anonymous" data-gl-media={src} />
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}
