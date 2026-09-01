import { lines } from '../helpers.tsx'

export default function Header() {
  return (
    <header className="header">
      <div className="header__wrapper">
        <div className="header__column">
          <p className="header__title" data-gl-text="uppercase">
            {lines(['Luis', 'Bizarro'])}
          </p>
        </div>

        <div className="header__column">
          <a
            className="header__location"
            data-gl-text="uppercase"
            href="https://interactive.dev/"
            rel="noopener"
            target="_blank"
          >
            {lines(['Interactive', 'Development'])}
          </a>
        </div>

        <div className="header__column">
          <p className="header__role" data-gl-text="uppercase">
            {lines(['Creative', 'Technologist'])}
          </p>

          <p className="header__year" data-gl-text="">
            {lines(['95', '25'])}
          </p>
        </div>

        <div className="header__column">
          <p className="header__shape" data-gl-text="">
            ✦
          </p>
        </div>
      </div>

      <h1 className="header__logo">
        <img
          alt="Bizarro™"
          className="header__logo__media"
          data-gl-media="/shared/bizarro.webp"
          src="/shared/bizarro.webp"
          fetchpriority="high"
        />
        Bizarro™
      </h1>
    </header>
  )
}
