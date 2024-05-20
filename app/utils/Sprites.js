;(async function () {
  const request = await window.fetch('/assets/bundle.svg')
  const response = await request.text()

  const sprite = document.createElement('div')

  sprite.innerHTML = response

  sprite.style.left = '-999999px'
  sprite.style.opacity = 0
  sprite.style.position = 'absolute'
  sprite.style.top = 0

  document.body.appendChild(sprite)
})()
