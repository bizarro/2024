import { Mesh, Program, Texture } from '@bizarro/slayt/libraries/ogl'

import { App, Scroll, getBounds } from '@bizarro/slayt'

import fragment from '../../shaders/text-fragment.glsl'
import vertex from '../../shaders/text-vertex.glsl'

export class Text {
  constructor({ element, geometry, scene }) {
    this.element = element
    this.geometry = geometry
    this.scene = scene

    this.element.style.color = 'transparent'

    this.bounds = getBounds(this.element)

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.height = this.bounds.height
    canvas.width = this.bounds.width

    let text = this.element.textContent.trim().replace(/  /g, '').replace(/<br>/g, '')

    if (this.element.dataset.glText === 'uppercase') {
      text = text.toUpperCase()
    }

    const { fontFamily, fontSize, letterSpacing, lineHeight } = getComputedStyle(this.element)

    context.fillStyle = '#fff'
    context.font = `${fontSize}/${lineHeight} ${fontFamily}`
    context.letterSpacing = letterSpacing
    context.textAlign = 'left'
    context.textBaseline = 'top'

    const lines = text.split('\n')

    for (let i = 0; i < lines.length; i += 1) {
      const lineSpacing = lineHeight.replace('px', '')

      context.fillText(lines[i], 0, (i * lineSpacing).toFixed(2))
    }

    this.createImage(canvas)
  }

  createImage(canvas) {
    const image = document.createElement('img')

    image.onload = () => {
      this.createMesh(image)
    }

    image.src = canvas.toDataURL('image/webp', 1)
  }

  createMesh(image) {
    const texture = new Texture(App.canvas.gl)

    texture.image = image

    const program = new Program(App.canvas.gl, {
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

    this.mesh = new Mesh(App.canvas.gl, {
      geometry: this.geometry,
      program,
    })

    this.mesh.setParent(this.scene)
  }

  onResize() {
    this.bounds = getBounds(this.element)
  }

  onLoop() {
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

    this.mesh.scale.x = (App.canvas.sizes.x * this.bounds.width) / App.canvas.viewport.x
    this.mesh.scale.y = (App.canvas.sizes.y * this.bounds.height) / App.canvas.viewport.y

    const x = this.bounds.left
    const y = this.bounds.top - Scroll.lenis.scroll

    const xFix = -(App.canvas.sizes.x / 2) + this.mesh.scale.x / 2
    const yFix = App.canvas.sizes.y / 2 - this.mesh.scale.y / 2

    this.mesh.position.x = xFix + (x / App.canvas.viewport.x) * App.canvas.sizes.x
    this.mesh.position.y = yFix - (y / App.canvas.viewport.y) * App.canvas.sizes.y
  }

  destroy() {
    super.destroy()

    this.mesh.setParent(null)
  }
}
