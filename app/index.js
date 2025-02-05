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

const inquiries = document.querySelector('.inquiries')
const inquiriesForm = document.querySelector('.inquiries__form')
const inquiriesInputs = document.querySelectorAll('.inquiries__field__input')
const inquiriesClose = document.querySelector('.inquiries__close')

const onHashCheck = () => {
  if (window.location.hash === '#inquiries') {
    inquiries.classList.add('inquiries--active')
  } else {
    inquiries.classList.remove('inquiries--active')
  }
}

window.addEventListener('hashchange', onHashCheck)

onHashCheck()

inquiriesClose.addEventListener('click', () => {
  inquiries.classList.remove('inquiries--active')

  history.pushState('', document.title, window.location.pathname + window.location.search)
})

inquiriesForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const data = {}

  inquiriesInputs.forEach((field) => {
    data[field.name] = field.value
  })

  const json = JSON.stringify(data)

  const response = await window.fetch('/contact', {
    body: json,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  alert('Thanks for reaching out!')

  inquiriesForm.reset()
})
