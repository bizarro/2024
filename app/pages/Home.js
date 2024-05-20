import { Component } from '../classes/Component'

export class Home extends Component {
  constructor() {
    super({
      element: '.home',
      elements: {
        wrapper: '.home__wrapper',

        header: '.home__header',
        headerLogo: '.home__header__logo',

        medias: '[data-gl-media]',
        texts: '[data-gl-text]',
      },
    })
  }
}
