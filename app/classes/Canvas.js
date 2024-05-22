import AutoBind from 'auto-bind'
import Lenis from 'lenis'
import debounce from 'lodash/debounce'
import { Camera, Color, Geometry, Post, Program, Mesh, Renderer, RenderTarget, Vec2 } from 'ogl'

import { Home } from '../scenes/Home'
import { BREAKPOINT_PHONE } from '../utils/Contants'

const fragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform sampler2D tFluid;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
      vec3 fluid = texture2D(tFluid, vUv).rgb;
      vec2 uv = vUv;
      vec2 uv2 = vUv - fluid.rg * 0.0003;

      vec4 color = texture2D(tMap, uv2);

      vec3 rgb = fluid * 0.003;

      color.r = texture2D(tMap, vec2(uv.x + rgb.x, uv.y + rgb.y)).r;
      color.g = texture2D(tMap, vec2(uv.x - rgb.x, uv.y + rgb.y)).g;
      color.b = texture2D(tMap, vec2(uv.x - rgb.x, uv.y - rgb.y)).b;

      gl_FragColor = color;

      // Oscillate between fluid values and the distorted scene
      // gl_FragColor = mix(color, vec4(fluid * 0.1 + 0.5, 1), smoothstep(0.0, 0.7, sin(uTime)));
  }
`

const baseVertex = /* glsl */ `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = uv;

    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);

    gl_Position = vec4(position, 0, 1);
  }
`

const clearShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;

  varying highp vec2 vUv;
  
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`

const splatShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;

  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
    vec2 p = vUv - point.xy;

    p.x *= aspectRatio;

    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;

    gl_FragColor = vec4(base + splat, 1.0);
  }
`

const advectionManualFilteringShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;

  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);

    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;

    gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
    gl_FragColor.a = 1.0;
  }
`

const advectionShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;

  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;

  void main () {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;

    gl_FragColor = dissipation * texture2D(uSource, coord);
    gl_FragColor.a = 1.0;
  }
`

const divergenceShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;

  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;

  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;

    vec2 C = texture2D(uVelocity, vUv).xy;

    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }

    float div = 0.5 * (R - L + T - B);

    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`

const curlShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;

  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;

  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;

    float vorticity = R - L - T + B;

    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`

const vorticityShader = /* glsl */ `
  precision highp float;
  precision highp sampler2D;

  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));

    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 vel = texture2D(uVelocity, vUv).xy;

    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
  }
`

const pressureShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;

  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;

  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;

    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;

    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`

const gradientSubtractShader = /* glsl */ `
  precision mediump float;
  precision mediump sampler2D;

  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;

  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;

    vec2 velocity = texture2D(uVelocity, vUv).xy;

    velocity.xy -= vec2(R - L, T - B);

    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

const renderer = new Renderer({
  alpha: true,
  antialias: true,
  dpr: window.devicePixelRatio,
})

const gl = renderer.gl

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type)
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type)
      default:
        return null
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

// Resolution of simulation
const simRes = 128
const dyeRes = 512

// Main inputs to control look and feel of fluid
const iterations = 3
let densityDissipation = 0.93
let velocityDissipation = 0.9
let pressureDissipation = 0.8
let curlStrength = 20
let radius = 0.3

const texelSize = { value: new Vec2(1 / simRes) }

// Get supported formats and types for FBOs
let supportLinearFiltering = gl.renderer.extensions[`OES_texture_${gl.renderer.isWebgl2 ? `` : `half_`}float_linear`]
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
      width: dyeRes,
      height: dyeRes,
      type: halfFloat,
      format: rgba?.format,
      internalFormat: rgba?.internalFormat,
      minFilter: filtering,
      depth: false,
    })

    this.velocity = createDoubleFBO(this.gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: rg?.format,
      internalFormat: rg?.internalFormat,
      minFilter: filtering,
      depth: false,
    })

    this.pressure = createDoubleFBO(this.gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false,
    })

    this.divergence = new RenderTarget(this.gl, {
      width: simRes,
      height: simRes,
      type: halfFloat,
      format: r?.format,
      internalFormat: r?.internalFormat,
      minFilter: gl.NEAREST,
      depth: false,
    })

    this.curl = new RenderTarget(this.gl, {
      width: simRes,
      height: simRes,
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
          dyeTexelSize: { value: new Vec2(1 / dyeRes) },
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

    for (let i = 0; i < iterations; i++) {
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

    this.advectionProgram.program.uniforms.dyeTexelSize.value.set(1 / simRes)
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

    this.advectionProgram.program.uniforms.dyeTexelSize.value.set(1 / dyeRes)
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
