import { Mesh, Program, Texture } from 'ogl'

import { getBounds } from '../utils/DOM'

import fragment from '../shaders/media-fragment.glsl'
import vertex from '../shaders/media-vertex.glsl'

export class Background {
  constructor({ canvas, element, geometry, scene }) {
    this.canvas = canvas
    this.element = element
    this.geometry = geometry
    this.scene = scene

    this.element.setAttribute('data-gl-text-active', '')

    this.bounds = getBounds(this.element)

    const canvasBackground = document.createElement('canvas')
    const context = canvasBackground.getContext('2d')

    const width = this.element.querySelector('[data-gl-background-line]').offsetLeft

    canvasBackground.height = this.bounds.height
    canvasBackground.width = this.bounds.width

    context.strokeStyle = '#fff'
    context.lineWidth = 2

    context.beginPath()
    context.moveTo(width, 0)
    context.lineTo(width, this.bounds.height - 2)
    context.stroke()
    context.closePath()

    context.beginPath()
    context.roundRect(0, 0, this.bounds.width - 2, this.bounds.height - 2, 10)
    context.stroke()
    context.closePath()

    this.createImage(canvasBackground)
  }

  createImage(canvas) {
    const image = document.createElement('img')

    image.onload = () => {
      this.createMesh(image)
    }

    image.src = canvas.toDataURL('image/webp', 1)
  }

  createMesh(image) {
    const texture = new Texture(this.canvas.gl, {
      premultiplyAlpha: true,
    })

    texture.image = image

    const program = new Program(this.canvas.gl, {
      fragment,
      uniforms: {
        tMap: { value: texture },
        tCover: { value: null },
        uAlpha: { value: 1 },
        uNoise: { value: 0 },
        uOpacity: { value: 1 },
        uResolution: { value: [0, 0, 0, 0] },
        uTime: { value: 0 },
        uTransition: { value: 0 },
      },
      vertex,
    })

    this.mesh = new Mesh(this.canvas.gl, {
      geometry: this.geometry,
      program,
    })

    this.mesh.setParent(this.scene)
  }

  onResize() {
    this.bounds = getBounds(this.element)
  }

  onLoop(scroll) {
    if (!this.bounds) return
    if (!this.mesh) return

    const aspect = this.bounds.height / this.bounds.width

    let a1
    let a2

    if (this.mesh.scale.y / this.mesh.scale.x > aspect) {
      a1 = (this.mesh.scale.x / this.mesh.scale.y) * aspect
      a2 = 1
    } else {
      a1 = 1
      a2 = this.mesh.scale.y / this.mesh.scale.x / aspect
    }

    this.mesh.program.uniforms.uResolution.value = [this.mesh.scale.x, this.mesh.scale.y, a1, a2]

    this.mesh.scale.x = (this.canvas.sizes.x * this.bounds.width) / this.canvas.viewport.x
    this.mesh.scale.y = (this.canvas.sizes.y * this.bounds.height) / this.canvas.viewport.y

    const x = this.bounds.left
    const y = this.bounds.top - scroll

    const xFix = -(this.canvas.sizes.x / 2) + this.mesh.scale.x / 2
    const yFix = this.canvas.sizes.y / 2 - this.mesh.scale.y / 2

    this.mesh.position.x = xFix + (x / this.canvas.viewport.x) * this.canvas.sizes.x
    this.mesh.position.y = yFix - (y / this.canvas.viewport.y) * this.canvas.sizes.y
  }
}
