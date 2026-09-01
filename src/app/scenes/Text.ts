import type { Geometry, OGLRenderingContext, Transform } from 'ogl'
import { Mesh, Program, Texture } from 'ogl'
import type { Canvas } from '../classes/Canvas'
import fragment from '../shaders/text-fragment.glsl'
import vertex from '../shaders/text-vertex.glsl'
import type { Bounds } from '../utils/DOM'
import { getBounds } from '../utils/DOM'

// Every text mesh renders the same shader, so a single program is compiled
// once and shared — per-mesh values are written in onBeforeRender, which OGL
// invokes before the program's uniforms are uploaded for each draw.
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

interface TextOptions {
  canvas: Canvas
  element: HTMLElement
  geometry: Geometry
  scene: Transform
}

export class Text {
  canvas: Canvas
  element: HTMLElement
  geometry: Geometry
  scene: Transform
  bounds: Bounds
  texture: Texture
  mesh: Mesh
  resolution = [0, 0, 0, 0]

  constructor({ canvas, element, geometry, scene }: TextOptions) {
    this.canvas = canvas
    this.element = element
    this.geometry = geometry
    this.scene = scene

    this.element.setAttribute('data-gl-text-active', '')

    this.bounds = getBounds(this.element)

    const canvasText = document.createElement('canvas')
    const context = canvasText.getContext('2d')!

    const dpr = Math.min(window.devicePixelRatio, 2)

    canvasText.height = this.bounds.height * dpr
    canvasText.width = this.bounds.width * dpr

    let text = this.element.textContent!.trim().replace(/ {2}/g, '').replace(/<br>/g, '')

    if (this.element.dataset.glText === 'uppercase') {
      text = text.toUpperCase()
    }

    const { fontFamily, fontSize, letterSpacing, lineHeight } = getComputedStyle(this.element)
    const fontSizeValue = Number(fontSize.replace('px', ''))
    const lineHeightValue = Number(lineHeight.replace('px', ''))

    context.fillStyle = '#fff'
    context.font = `${fontSizeValue * dpr}px/${lineHeightValue * dpr}px ${fontFamily}`
    context.letterSpacing = String(Number(letterSpacing) * dpr)
    context.textAlign = 'left'
    context.textBaseline = 'top'

    const lines = text.split('\n')

    for (let i = 0; i < lines.length; i += 1) {
      context.fillText(lines[i], 0, Number((i * lineHeightValue * dpr).toFixed(2)))
    }

    // The canvas is uploaded to the texture directly — no toDataURL encode or
    // <img> decode round-trip — so the mesh exists before the first frame.
    this.texture = new Texture(this.canvas.gl, {
      premultiplyAlpha: true,
    })

    this.texture.image = canvasText

    this.mesh = new Mesh(this.canvas.gl, {
      geometry: this.geometry,
      program: getProgram(this.canvas.gl),
    })

    this.mesh.onBeforeRender(() => {
      this.mesh.program.uniforms.tMap.value = this.texture
      this.mesh.program.uniforms.uResolution.value = this.resolution
    })

    this.mesh.position.z = 0.01

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
