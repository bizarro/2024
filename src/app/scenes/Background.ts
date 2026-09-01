import type { Geometry, OGLRenderingContext, Transform } from 'ogl'
import { Mesh, Program, Texture } from 'ogl'
import type { Canvas } from '../classes/Canvas'
import fragment from '../shaders/background-fragment.glsl'
import vertex from '../shaders/background-vertex.glsl'
import type { Bounds } from '../utils/DOM'
import { getBounds } from '../utils/DOM'

// Every background mesh renders the same shader, so a single program is
// compiled once and shared — per-mesh values are written in onBeforeRender,
// which OGL invokes before the program's uniforms are uploaded for each draw.
let sharedProgram: Program | null = null

function getProgram(gl: OGLRenderingContext) {
  if (!sharedProgram) {
    sharedProgram = new Program(gl, {
      fragment,
      uniforms: {
        tMap: { value: null },
        uResolution: { value: [0, 0, 0, 0] },
      },
      vertex,
    })
  }

  return sharedProgram
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 5) {
  const corners = { tl: radius, tr: radius, br: radius, bl: radius }

  context.beginPath()
  context.moveTo(x + corners.tl, y)
  context.lineTo(x + width - corners.tr, y)
  context.quadraticCurveTo(x + width, y, x + width, y + corners.tr)
  context.lineTo(x + width, y + height - corners.br)
  context.quadraticCurveTo(x + width, y + height, x + width - corners.br, y + height)
  context.lineTo(x + corners.bl, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - corners.bl)
  context.lineTo(x, y + corners.tl)
  context.quadraticCurveTo(x, y, x + corners.tl, y)
  context.closePath()

  context.stroke()
}

interface BackgroundOptions {
  canvas: Canvas
  element: HTMLElement
  geometry: Geometry
  scene: Transform
}

export class Background {
  canvas: Canvas
  element: HTMLElement
  geometry: Geometry
  scene: Transform
  bounds: Bounds
  texture: Texture
  mesh: Mesh
  resolution = [0, 0, 0, 0]

  constructor({ canvas, element, geometry, scene }: BackgroundOptions) {
    this.canvas = canvas
    this.element = element
    this.geometry = geometry
    this.scene = scene

    this.element.setAttribute('data-gl-text-active', '')

    this.bounds = getBounds(this.element)

    const canvasBackground = document.createElement('canvas')
    const context = canvasBackground.getContext('2d')!

    const offset = this.element.querySelector<HTMLElement>('[data-gl-background-line]')!.offsetLeft
    const border = 2 * 2
    const height = this.bounds.height * 2
    const width = this.bounds.width * 2

    canvasBackground.height = height
    canvasBackground.width = width

    context.strokeStyle = '#fff'
    context.lineWidth = border

    context.beginPath()
    context.moveTo(offset * 2, 0)
    context.lineTo(offset * 2, width - border / 2)
    context.stroke()
    context.closePath()

    roundRect(context, 1, 1, width - border / 2, height - border / 2, 15)

    // The canvas is uploaded to the texture directly — no toDataURL encode or
    // <img> decode round-trip — so the mesh exists before the first frame.
    this.texture = new Texture(this.canvas.gl, {
      premultiplyAlpha: true,
    })

    this.texture.image = canvasBackground

    this.mesh = new Mesh(this.canvas.gl, {
      geometry: this.geometry,
      program: getProgram(this.canvas.gl),
    })

    this.mesh.onBeforeRender(() => {
      this.mesh.program.uniforms.tMap.value = this.texture
      this.mesh.program.uniforms.uResolution.value = this.resolution
    })

    this.mesh.setParent(this.scene)
  }

  onResize() {
    this.bounds = getBounds(this.element)
  }

  onLoop(scroll: number) {
    if (!this.bounds) return
    if (!this.mesh) return

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
