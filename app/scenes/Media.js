import { Mesh, Program, Texture } from 'ogl'

import { getBounds } from '../utils/DOM'

import fragment from '../shaders/media-fragment.glsl'
import vertex from '../shaders/media-vertex.glsl'

export class Media {
  constructor({ canvas, element, geometry, scene }) {
    this.canvas = canvas
    this.element = element
    this.geometry = geometry
    this.scene = scene

    this.element.setAttribute('crossorigin', 'anonymous')
    this.element.setAttribute('data-gl-media-active', '')

    this.createTexture()
    this.createMesh()
  }

  createTexture() {
    this.texture = new Texture(this.canvas.gl, {
      premultiplyAlpha: true,
    })

    this.element.src = this.element.dataset.glMedia

    if (this.element.src.includes('mp4')) {
      this.element.load()

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.element.play()

            this.isVideoVisible = true
          } else if (!entry.isIntersecting) {
            this.element.pause()

            this.isVideoVisible = false
          }
        })
      }).observe(this.element.parentNode)
    } else {
      this.element.onload = () => {
        this.texture.image = this.element
      }
    }
  }

  createMesh() {
    this.program = new Program(this.canvas.gl, {
      fragment,
      uniforms: {
        tMap: { value: this.texture },
        tCover: { value: null },
        uAlpha: { value: 1 },
        uNoise: { value: 0 },
        uOpacity: { value: 1 },
        uResolution: { value: [0, 0, 0, 0] },
        uTime: { value: 0 },
        uTransition: { value: 0 },
      },
      vertex,
      transparent: true,
    })

    this.mesh = new Mesh(this.canvas.gl, {
      geometry: this.geometry,
      program: this.program,
    })

    this.mesh.setParent(this.scene)
  }

  //
  // Events.
  //
  onResize() {
    this.bounds = getBounds(this.element)
  }

  onLoop(scroll) {
    if (!this.bounds) return
    if (!this.mesh) return

    if (this.isVideoVisible) {
      this.texture.image = this.element

      if (this.element.readyState >= this.element.HAVE_ENOUGH_DATA) {
        this.texture.needsUpdate = true
      }
    }

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
