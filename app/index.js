import './utils/Polyfills'
import './utils/Sprites'

import '../styles/index.scss'

import AutoBind from 'auto-bind'
import Lenis from 'lenis'

import { Canvas } from './classes/Canvas'
import { Home } from './pages/Home'

class App {
  constructor() {
    AutoBind(this)

    this.lenis = new Lenis({
      wrapper: window,
      content: document.body,
    })

    this.page = new Home({
      app: this,
    })

    this.canvas = new Canvas({
      app: this,
    })

    this.onResize()
    this.onLoop()

    window.addEventListener('resize', this.onResize.bind(this))
  }

  onLoop(now) {
    this.canvas.onLoop(this.lenis.scroll)

    this.lenis?.raf(now)

    window.requestAnimationFrame(this.onLoop.bind(this))
  }

  onResize() {
    const { innerHeight, innerWidth } = window

    document.documentElement.style.setProperty('--100vh', `${innerHeight}px`)
    document.documentElement.style.setProperty('--100vw', `${innerWidth}px`)

    this.canvas.onResize({
      height: innerHeight,
      width: innerWidth,
    })
  }
}

document.fonts.ready.then(() => {
  new App()
})
