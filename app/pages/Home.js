import GSAP from '@bizarro/slayt/libraries/gsap'

import { Page } from '@bizarro/slayt'

export class Home extends Page {
  constructor(args) {
    super({
      ...args,
      classes: {},
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

  show({ from, to } = {}) {
    this.timelineIn = GSAP.timeline({
      paused: true,
    })

    if (from) {
      this.timelineIn.fromTo(
        this.element,
        {
          autoAlpha: 1,
          y: '100%',
        },
        {
          autoAlpha: 1,
          duration: 1.5,
          ease: 'expo.inOut',
          y: '0%',
        },
      )
    } else {
      this.timelineIn.to(this.element, {
        autoAlpha: 1,
        duration: 0.001,
        y: '0%',
      })
    }

    this.timelineIn.call(() => {
      GSAP.delayedCall(1, () => {
        this.isVisible = true
      })
    })

    return super.show(this.timelineIn)
  }

  hide() {
    this.timelineOut = GSAP.timeline({
      paused: true,
    })

    this.timelineOut.to(this.element, {
      autoAlpha: 0,
      duration: 1.5,
      ease: 'expo.inOut',
      scale: 0.9,
    })

    this.timelineOut.call(() => {
      this.isVisible = false
    })

    return super.hide(this.timelineOut)
  }
}
