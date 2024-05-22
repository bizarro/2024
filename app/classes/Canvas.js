import AutoBind from 'auto-bind'
import Lenis from 'lenis'
import debounce from 'lodash/debounce'
import { Camera, Color, Geometry, Post, Program, Mesh, Renderer, RenderTarget, Vec2 } from 'ogl'

import { Home } from '../scenes/Home'
import { BREAKPOINT_PHONE } from '../utils/Contants'

import advectionManualFilteringShader from '../shaders/advection-manual-filtering-shader.glsl'
import advectionShader from '../shaders/advection-shader.glsl'
import baseVertex from '../shaders/base-vertex.glsl'
import clearShader from '../shaders/clear-shader.glsl'
import curlShader from '../shaders/curl-shader.glsl'
import divergenceShader from '../shaders/divergence-shader.glsl'
import fragment from '../shaders/fragment.glsl'
import gradientSubtractShader from '../shaders/gradient-subtract-shader.glsl'
import pressureShader from '../shaders/pressure-shader.glsl'
import splatShader from '../shaders/splat-shader.glsl'
import vorticityShader from '../shaders/vorticity-shader.glsl'

export const renderer = new Renderer({
  alpha: true,
  antialias: true,
  dpr: window.devicePixelRatio,
})

export const gl = renderer.gl

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    // prettier-ignore
    switch (internalFormat) {
      case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type)
      case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type)
      default: return null
    }
  }

  return { internalFormat, format }
}

function supportRenderTextureFormat(gl, internalFormat, format, type) {
  let texture = gl.createTexture()

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)

  let fbo = gl.createFramebuffer()

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)

  if (status != gl.FRAMEBUFFER_COMPLETE) {
    return false
  }

  return true
}

function createDoubleFBO(
  gl,
  {
    width,
    height,
    wrapS,
    wrapT,
    minFilter = gl.LINEAR,
    magFilter = minFilter,
    type,
    format,
    internalFormat,
    depth,
  } = {},
) {
  const options = { width, height, wrapS, wrapT, minFilter, magFilter, type, format, internalFormat, depth }

  const fbo = {
    read: new RenderTarget(gl, options),
    write: new RenderTarget(gl, options),
    swap: () => {
      let temp = fbo.read
      fbo.read = fbo.write
      fbo.write = temp
    },
  }

  return fbo
}

const SIMULATION_RESOLUTION = 128
const DYE_RESOLUTION = 512
const ITERATIONS = 3

let densityDissipation = 0.93
let velocityDissipation = 0.9
let pressureDissipation = 0.8
let curlStrength = 20
let radius = 0.3

const texelSize = {
  value: new Vec2(1 / SIMULATION_RESOLUTION),
}

// Get supported formats and types for FBOs
const supportLinearFiltering = gl.renderer.extensions[`OES_texture_${gl.renderer.isWebgl2 ? `` : `half_`}float_linear`]
const halfFloat = gl.renderer.isWebgl2 ? gl.HALF_FLOAT : gl.renderer.extensions['OES_texture_half_float'].HALF_FLOAT_OES
const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST

let rgba, rg, r

if (gl.renderer.isWebgl2) {
  rgba = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloat)
  rg = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloat)
  r = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloat)
} else {
  rgba = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloat)
  rg = rgba
  r = rgba
}

gl.renderer.getExtension('OES_standard_derivatives')

const lastMouse = new Vec2()

const KEYS = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  65: 'a',
  66: 'b',
}

const KONAMI = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a']

export class Canvas {
  constructor() {
    AutoBind(this)

    this.createScroll()
    this.createRenderer()
    this.createCamera()
    this.createPost()
    this.createMouseFluid()

    this.createScene()

    this.onResize({
      height: window.innerHeight,
      width: window.innerWidth,
    })

    this.onResize = debounce(this.onResize.bind(this), 400)

    window.addEventListener('resize', this.onResize)

    this.onLoop()

    this.isKonami = false
    this.konamiCodePosition = 0

    document.addEventListener('keydown', this.onKeydown.bind(this))
  }

  onKeydown({ keyCode }) {
    const key = KEYS[keyCode]
    const requiredKey = KONAMI[this.konamiCodePosition]

    // compare the key with the required key
    if (key == requiredKey) {
      // move to the next key in the konami code sequence
      this.konamiCodePosition++

      // if the last key is reached, activate cheats
      if (this.konamiCodePosition == KONAMI.length) {
        this.activateCheats()

        this.konamiCodePosition = 0
      }
    } else {
      this.konamiCodePosition = 0
    }
  }

  activateCheats() {
    if (this.isKonami) {
      densityDissipation = 0.93
    } else {
      densityDissipation = 0.99
    }

    this.isKonami = !this.isKonami
  }

  createScroll() {
    this.lenis = new Lenis({
      content: document.body,
      wrapper: document.body,
    })
  }

  createRenderer() {
    this.renderer = renderer

    this.gl = renderer.gl
    this.gl.canvas.classList.add('canvas')

    document.body.appendChild(this.gl.canvas)
  }

  createPost() {
    this.post = new Post(this.gl)

    this.pass = this.post.addPass({
      fragment,
      uniforms: {
        tFluid: { value: null },
        uTime: { value: 0 },
      },
    })
  }

  createMouseFluid() {
    // Create fluid simulation FBOs
    this.density = createDoubleFBO(this.gl, {
      width: DYE_RESOLUTION,
      height: DYE_RESOLUTION,
      type: halfFloat,
      format: rgba?.format,
      internalFormat: rgba?.internalFormat,
      minFilter: filtering,
      depth: false,
    })

    this.velocity = createDoubleFBO(this.gl, {
      width: SIMULATION_RESOLUTION,
      height: SIMULATION_RESOLUTION,
      type: halfFloat,
      format: rg?.format,
      internalFormat: rg?.internalFormat,
      minFilter: filtering,
      depth: false,
    })

    this.pressure = createDoubleFBO(this.gl, {
      width: SIMULATION_RESOLUTION,
      height: SIMULATION_RESOLUTION,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false,
    })

    this.divergence = new RenderTarget(this.gl, {
      width: SIMULATION_RESOLUTION,
      height: SIMULATION_RESOLUTION,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false,
    })

    this.curl = new RenderTarget(this.gl, {
      width: SIMULATION_RESOLUTION,
      height: SIMULATION_RESOLUTION,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false,
    })

    // Geometry to be used for the simulation programs
    this.triangle = new Geometry(this.gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    })

    // Create fluid simulation programs
    this.clearProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: clearShader,
        uniforms: {
          texelSize,
          uTexture: { value: null },
          value: { value: pressureDissipation },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.splatProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: splatShader,
        uniforms: {
          texelSize,
          uTarget: { value: null },
          aspectRatio: { value: 1 },
          color: { value: new Color() },
          point: { value: new Vec2() },
          radius: { value: radius / 100 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.advectionProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: supportLinearFiltering ? advectionShader : advectionManualFilteringShader,
        uniforms: {
          texelSize,
          dyeTexelSize: { value: new Vec2(1 / DYE_RESOLUTION) },
          uVelocity: { value: null },
          uSource: { value: null },
          dt: { value: 0.016 },
          dissipation: { value: 1 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.divergenceProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: divergenceShader,
        uniforms: {
          texelSize,
          uVelocity: { value: null },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.curlProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: curlShader,
        uniforms: {
          texelSize,
          uVelocity: { value: null },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.vorticityProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: vorticityShader,
        uniforms: {
          texelSize,
          uVelocity: { value: null },
          uCurl: { value: null },
          curl: { value: curlStrength },
          dt: { value: 0.016 },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.pressureProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: pressureShader,
        uniforms: {
          texelSize,
          uPressure: { value: null },
          uDivergence: { value: null },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.gradientSubtractProgram = new Mesh(this.gl, {
      geometry: this.triangle,
      program: new Program(this.gl, {
        vertex: baseVertex,
        fragment: gradientSubtractShader,
        uniforms: {
          texelSize,
          uPressure: { value: null },
          uVelocity: { value: null },
        },
        depthTest: false,
        depthWrite: false,
      }),
    })

    this.splats = []

    // Create handlers to get mouse position and velocity
    window.addEventListener('touchstart', this.updateMouse, false)
    window.addEventListener('touchmove', this.updateMouse, false)
    window.addEventListener('mousemove', this.updateMouse, false)
  }

  createCamera() {
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 2
  }

  createScene() {
    this.scene = new Home({
      canvas: this,
    })
  }

  updateMouse(e) {
    if (e.changedTouches && e.changedTouches.length) {
      e.x = e.changedTouches[0].pageX
      e.y = e.changedTouches[0].pageY
    }
    if (e.x === undefined) {
      e.x = e.pageX
      e.y = e.pageY
    }

    if (!lastMouse.isInit) {
      lastMouse.isInit = true

      // First input
      lastMouse.set(e.x, e.y)
    }

    const deltaX = e.x - lastMouse.x
    const deltaY = e.y - lastMouse.y

    lastMouse.set(e.x, e.y)

    // Add if the mouse is moving
    if (Math.abs(deltaX) || Math.abs(deltaY)) {
      this.splats.push({
        // Get mouse value in 0 to 1 range, with y flipped
        x: e.x / gl.renderer.width,
        y: 1 - e.y / gl.renderer.height,
        dx: deltaX * 5,
        dy: deltaY * -5,
      })
    }
  }

  // Function to draw number of interactions onto input render target
  splat({ x, y, dx, dy }) {
    this.splatProgram.program.uniforms.uTarget.value = this.velocity.read.texture
    this.splatProgram.program.uniforms.aspectRatio.value = gl.renderer.width / gl.renderer.height
    this.splatProgram.program.uniforms.point.value.set(x, y)
    this.splatProgram.program.uniforms.color.value.set(dx, dy, 1)

    gl.renderer.render({
      scene: this.splatProgram,
      target: this.velocity.write,
      sort: false,
      update: false,
    })

    this.velocity.swap()

    this.splatProgram.program.uniforms.uTarget.value = this.density.read.texture

    gl.renderer.render({
      scene: this.splatProgram,
      target: this.density.write,
      sort: false,
      update: false,
    })

    this.density.swap()
  }

  //
  // Events.
  //
  onLoop(now) {
    this.lenis?.raf(now)

    if (window.innerWidth <= BREAKPOINT_PHONE) {
      return window.requestAnimationFrame(this.onLoop.bind(this))
    }

    // Perform all of the fluid simulation renders
    // No need to clear during sim, saving a number of GL calls.
    this.renderer.autoClear = false

    // Render all of the inputs since last frame
    for (let i = this.splats.length - 1; i >= 0; i--) {
      this.splat(this.splats.splice(i, 1)[0])
    }

    this.curlProgram.program.uniforms.uVelocity.value = this.velocity.read.texture

    this.renderer.render({
      scene: this.curlProgram,
      target: this.curl,
      sort: false,
      update: false,
    })

    this.vorticityProgram.program.uniforms.uVelocity.value = this.velocity.read.texture
    this.vorticityProgram.program.uniforms.uCurl.value = this.curl.texture

    this.renderer.render({
      scene: this.vorticityProgram,
      target: this.velocity.write,
      sort: false,
      update: false,
    })

    this.velocity.swap()

    this.divergenceProgram.program.uniforms.uVelocity.value = this.velocity.read.texture

    this.renderer.render({
      scene: this.divergenceProgram,
      target: this.divergence,
      sort: false,
      update: false,
    })

    this.clearProgram.program.uniforms.uTexture.value = this.pressure.read.texture

    this.renderer.render({
      scene: this.clearProgram,
      target: this.pressure.write,
      sort: false,
      update: false,
    })

    this.pressure.swap()

    this.pressureProgram.program.uniforms.uDivergence.value = this.divergence.texture

    for (let i = 0; i < ITERATIONS; i++) {
      this.pressureProgram.program.uniforms.uPressure.value = this.pressure.read.texture

      this.renderer.render({
        scene: this.pressureProgram,
        target: this.pressure.write,
        sort: false,
        update: false,
      })

      this.pressure.swap()
    }

    this.gradientSubtractProgram.program.uniforms.uPressure.value = this.pressure.read.texture
    this.gradientSubtractProgram.program.uniforms.uVelocity.value = this.velocity.read.texture

    this.renderer.render({
      scene: this.gradientSubtractProgram,
      target: this.velocity.write,
      sort: false,
      update: false,
    })

    this.velocity.swap()

    this.advectionProgram.program.uniforms.dyeTexelSize.value.set(1 / SIMULATION_RESOLUTION)
    this.advectionProgram.program.uniforms.uVelocity.value = this.velocity.read.texture
    this.advectionProgram.program.uniforms.uSource.value = this.velocity.read.texture
    this.advectionProgram.program.uniforms.dissipation.value = velocityDissipation

    this.renderer.render({
      scene: this.advectionProgram,
      target: this.velocity.write,
      sort: false,
      update: false,
    })

    this.velocity.swap()

    this.advectionProgram.program.uniforms.dyeTexelSize.value.set(1 / DYE_RESOLUTION)
    this.advectionProgram.program.uniforms.uVelocity.value = this.velocity.read.texture
    this.advectionProgram.program.uniforms.uSource.value = this.density.read.texture
    this.advectionProgram.program.uniforms.dissipation.value = densityDissipation

    this.renderer.render({
      scene: this.advectionProgram,
      target: this.density.write,
      sort: false,
      update: false,
    })

    this.density.swap()

    // Set clear back to default
    this.renderer.autoClear = true

    // Update post pass uniform with the simulation output
    this.pass.uniforms.tFluid.value = this.density.read.texture

    this.post.render({
      camera: this.camera,
      scene: this.scene,
    })

    this.scene.onLoop(this.lenis.scroll)

    window.requestAnimationFrame(this.onLoop.bind(this))
  }

  onResize() {
    const { innerHeight: height, innerWidth: width } = window

    this.renderer.setSize(width, height)

    this.camera.perspective({
      aspect: width / height,
    })

    const fov = this.camera.fov * (Math.PI / 180)
    const sceneHeight = 2 * Math.tan(fov / 2) * this.camera.position.z
    const sceneWidth = sceneHeight * this.camera.aspect

    this.sizes = new Vec2(sceneWidth, sceneHeight)
    this.viewport = new Vec2(width, height)

    this.post.resize()

    this.scene.onResize()
  }
}
