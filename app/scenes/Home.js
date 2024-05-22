import { Plane, Transform } from 'ogl'

import { Background } from './Background'
import { Media } from './Media'
import { Text } from './Text'

export class Home extends Transform {
  constructor({ canvas }) {
    super()

    this.canvas = canvas

    const geometry = new Plane(this.canvas.gl, {
      heightSegments: 1,
      widthSegments: 1,
    })

    this.backgrounds = document.querySelectorAll('[data-gl-background]').map(
      (element) =>
        new Background({
          canvas: this.canvas,
          element,
          geometry,
          scene: this,
        }),
    )

    this.medias = document.querySelectorAll('[data-gl-media]').map(
      (element) =>
        new Media({
          canvas: this.canvas,
          element,
          geometry,
          scene: this,
        }),
    )

    this.texts = document.querySelectorAll('[data-gl-text]').map(
      (element) =>
        new Text({
          canvas: this.canvas,
          element,
          geometry,
          scene: this,
        }),
    )
  }

  onResize() {
    this.backgrounds?.forEach((background) => background.onResize())
    this.medias?.forEach((media) => media.onResize())
    this.texts?.forEach((text) => text.onResize())
  }

  onLoop(scroll) {
    this.backgrounds?.forEach((background) => background.onLoop(scroll))
    this.medias?.forEach((media) => media.onLoop(scroll))
    this.texts?.forEach((text) => text.onLoop(scroll))
  }
}
