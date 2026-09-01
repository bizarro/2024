import { Plane, Transform } from 'ogl'
import type { Canvas } from '../classes/Canvas'
import { Background } from './Background'
import { Media } from './Media'
import { Text } from './Text'

export class Home extends Transform {
  canvas: Canvas
  backgrounds: Background[]
  medias: Media[]
  texts: Text[]

  constructor({ canvas }: { canvas: Canvas }) {
    super()

    this.canvas = canvas

    const geometry = new Plane(this.canvas.gl, {
      heightSegments: 1,
      widthSegments: 1,
    })

    this.backgrounds = document.querySelectorAll<HTMLElement>('[data-gl-background]').map(
      (element) =>
        new Background({
          canvas: this.canvas,
          element,
          geometry,
          scene: this,
        }),
    )

    this.medias = document.querySelectorAll<HTMLImageElement | HTMLVideoElement>('[data-gl-media]').map(
      (element) =>
        new Media({
          canvas: this.canvas,
          element,
          geometry,
          scene: this,
        }),
    )

    this.texts = document.querySelectorAll<HTMLElement>('[data-gl-text]').map(
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
    this.backgrounds?.forEach((background) => {
      background.onResize()
    })
    this.medias?.forEach((media) => {
      media.onResize()
    })
    this.texts?.forEach((text) => {
      text.onResize()
    })
  }

  onLoop(scroll: number) {
    this.backgrounds?.forEach((background) => {
      background.onLoop(scroll)
    })
    this.medias?.forEach((media) => {
      media.onLoop(scroll)
    })
    this.texts?.forEach((text) => {
      text.onLoop(scroll)
    })
  }
}
