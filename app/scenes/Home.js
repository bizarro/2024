import { Plane, Transform } from 'ogl'

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
    this.medias?.forEach((media) => media.onResize())
    this.texts?.forEach((text) => text.onResize())
  }

  onLoop(scroll) {
    this.medias?.forEach((media) => media.onLoop(scroll))
    this.texts?.forEach((text) => text.onLoop(scroll))
  }
}
