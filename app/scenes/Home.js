import { Plane } from '@bizarro/slayt/libraries/ogl'

import { App, Scene } from '@bizarro/slayt'

import { Media } from './Home/Media'
import { Text } from './Home/Text'

export class Home extends Scene {
  create() {
    super.create()

    const geometry = new Plane(App.canvas.gl, {
      heightSegments: 1,
      widthSegments: 1,
    })

    this.medias = App.page.elements.medias.map(
      (element) =>
        new Media({
          element,
          geometry,
          scene: this,
        }),
    )

    this.texts = App.page.elements.texts.map(
      (element) =>
        new Text({
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

  onLoop() {
    this.medias?.forEach((media) => media.onLoop())
    this.texts?.forEach((text) => text.onLoop())
  }

  destroy() {
    super.destroy()

    this.medias?.forEach((media) => media.destroy())
    this.texts?.forEach((text) => text.destroy())
  }
}
