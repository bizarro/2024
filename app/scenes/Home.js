import { Plane, Transform } from 'ogl'

import { Media } from './Media'
import { Text } from './Text'

export class Home extends Transform {
  constructor({ canvas, page }) {
    super()

    this.canvas = canvas
    this.page = page

    const geometry = new Plane(this.canvas.gl, {
      heightSegments: 1,
      widthSegments: 1,
    })

    this.medias = this.page.elements.medias.map(
      (element) =>
        new Media({
          canvas: this.canvas,
          element,
          geometry,
          scene: this,
        }),
    )

    this.texts = this.page.elements.texts.map(
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

  destroy() {
    super.destroy()

    this.medias?.forEach((media) => media.destroy())
    this.texts?.forEach((text) => text.destroy())
  }
}
