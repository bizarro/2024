import { Mesh, Program, Texture } from 'ogl'

import { getBounds } from '../utils/DOM'

import fragment from '../shaders/text-fragment.glsl'
import vertex from '../shaders/text-vertex.glsl'

export class Text {
  constructor({ canvas, element, geometry, scene }) {
    this.canvas = canvas
    this.element = element
    this.geometry = geometry
    this.scene = scene

    this.element.setAttribute('data-gl-text-active', '')

    this.bounds = getBounds(this.element)

    const canvasText = document.createElement('canvas')
    const context = canvasText.getContext('2d')

    canvasText.height = this.bounds.height * 2
    canvasText.width = this.bounds.width * 2

    let text = this.element.textContent.trim().replace(/  /g, '').replace(/<br>/g, '')

    if (this.element.dataset.glText === 'uppercase') {
      text = text.toUpperCase()
    }

    const { fontFamily, fontSize, letterSpacing, lineHeight } = getComputedStyle(this.element)
    const fontSizeValue = fontSize.replace('px', '')
    const lineHeightValue = lineHeight.replace('px', '')

    context.fillStyle = '#fff'
    context.font = `${fontSizeValue * 2}px/${lineHeightValue * 2}px ${fontFamily}`
    context.letterSpacing = letterSpacing * 2
    context.textAlign = 'left'
    context.textBaseline = 'top'

    const lines = text.split('\n')

    for (let i = 0; i < lines.length; i += 1) {
      context.fillText(lines[i], 0, (i * lineHeightValue * 2).toFixed(2))
    }

    this.createImage(canvasText)
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

    this.mesh.position.z = 0.01

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
