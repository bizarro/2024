import './utils/Polyfills'
import './utils/Sprites'

import { Canvas } from './classes/Canvas'
import { BREAKPOINT_PHONE } from './utils/Contants'

import '../styles/index.scss'

if (window.innerWidth > BREAKPOINT_PHONE) {
  document.fonts.ready.then(() => {
    new Canvas()
  })
} else {
  document.querySelectorAll('[data-gl-media]').forEach((media) => {
    media.setAttribute('src', media.dataset.glMedia)
  })
}
