import type { Geometry, OGLRenderingContext, Transform } from 'ogl'
import { Mesh, Program, Texture } from 'ogl'
import type { Canvas } from '../classes/Canvas'
import fragment from '../shaders/media-fragment.glsl'
import vertex from '../shaders/media-vertex.glsl'
import type { Bounds } from '../utils/DOM'
import { getBounds } from '../utils/DOM'

type MediaElement = HTMLImageElement | HTMLVideoElement

// Every media mesh renders the same shader, so a single program is compiled
// once and shared — per-mesh values are written in onBeforeRender, which OGL
// invokes before the program's uniforms are uploaded for each draw.
let sharedProgram: Program | null = null

function getProgram(gl: OGLRenderingContext) {
  if (!sharedProgram) {
    sharedProgram = new Program(gl, {
      fragment,
      uniforms: {
        tMap: { value: null },
        uAlpha: { value: 0 },
        uResolution: { value: [0, 0, 0, 0] },
      },
      vertex,
      transparent: true,
    })
  }

  return sharedProgram
}

interface MediaOptions {
  canvas: Canvas
  element: MediaElement
  geometry: Geometry
  scene: Transform
}

export class Media {
  canvas: Canvas
  element: MediaElement
  geometry: Geometry
  scene: Transform
  texture!: Texture
  mesh!: Mesh
  bounds?: Bounds
  observer?: IntersectionObserver
  isVideoVisible?: boolean
  hasVideoFrameCallback?: boolean
  isLoaded = false
  alpha = 0
  resolution = [0, 0, 0, 0]

  constructor({ canvas, element, geometry, scene }: MediaOptions) {
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

    this.element.src = this.element.dataset.glMedia!

    if (this.element.src.includes('mp4')) {
      const element = this.element as HTMLVideoElement

      element.load()

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.play()

            this.isVideoVisible = true
          } else if (!entry.isIntersecting) {
            element.pause()

            this.isVideoVisible = false
          }
        })
      })

      this.observer.observe(this.element.parentNode as Element)

      // Upload only actual new video frames instead of re-uploading on every
      // rAF tick — the fallback path in onLoop covers browsers without it.
      if ('requestVideoFrameCallback' in element) {
        this.hasVideoFrameCallback = true

        const onFrame = () => {
          this.texture.image = element
          this.texture.needsUpdate = true
          this.isLoaded = true

          element.requestVideoFrameCallback(onFrame)
        }

        element.requestVideoFrameCallback(onFrame)
      }
    } else {
      const element = this.element as HTMLImageElement

      const show = () => {
        this.texture.image = element
        this.isLoaded = true
      }

      // decode() finishes the fetch and decodes off the main thread, so the
      // later texture upload doesn't land mid-frame as a visible hitch.
      element.decode().then(show, () => {
        if (element.complete && element.naturalWidth) {
          show()
        } else {
          element.onload = show
        }
      })
    }
  }

  createMesh() {
    this.mesh = new Mesh(this.canvas.gl, {
      geometry: this.geometry,
      program: getProgram(this.canvas.gl),
    })

    this.mesh.onBeforeRender(() => {
      this.mesh.program.uniforms.tMap.value = this.texture
      this.mesh.program.uniforms.uAlpha.value = this.alpha
      this.mesh.program.uniforms.uResolution.value = this.resolution
    })

    this.mesh.setParent(this.scene)
  }

  //
  // Events.
  //
  onResize() {
    this.bounds = getBounds(this.element)
  }

  onLoop(scroll: number) {
    if (!this.bounds) return
    if (!this.mesh) return

    if (this.isVideoVisible && !this.hasVideoFrameCallback) {
      this.texture.image = this.element

      const element = this.element as HTMLVideoElement

      if (element.readyState >= element.HAVE_ENOUGH_DATA) {
        this.texture.needsUpdate = true
        this.isLoaded = true
      }
    }

    // Fade in once the texture is ready instead of popping from black.
    if (this.isLoaded && this.alpha < 1) {
      this.alpha = Math.min(this.alpha + 0.06, 1)
    }

    this.mesh.scale.x = (this.canvas.sizes.x * this.bounds.width) / this.canvas.viewport.x
    this.mesh.scale.y = (this.canvas.sizes.y * this.bounds.height) / this.canvas.viewport.y

    const aspect = this.bounds.height / this.bounds.width

    let a1: number
    let a2: number

    if (this.mesh.scale.y / this.mesh.scale.x > aspect) {
      a1 = (this.mesh.scale.x / this.mesh.scale.y) * aspect
      a2 = 1
    } else {
      a1 = 1
      a2 = this.mesh.scale.y / this.mesh.scale.x / aspect
    }

    this.resolution[0] = this.mesh.scale.x
    this.resolution[1] = this.mesh.scale.y
    this.resolution[2] = a1
    this.resolution[3] = a2

    const x = this.bounds.left
    const y = this.bounds.top - scroll

    const xFix = -(this.canvas.sizes.x / 2) + this.mesh.scale.x / 2
    const yFix = this.canvas.sizes.y / 2 - this.mesh.scale.y / 2

    this.mesh.position.x = xFix + (x / this.canvas.viewport.x) * this.canvas.sizes.x
    this.mesh.position.y = yFix - (y / this.canvas.viewport.y) * this.canvas.sizes.y
  }
}
