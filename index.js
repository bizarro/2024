require('dotenv').config()

const express = require('express')
const app = express()
const path = require('path')

const UAParser = require('ua-parser-js')

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'twig')

const dataDefault = (request, response) => {
  const ua = UAParser(request.headers['user-agent'])

  const isDesktop = ua.device.type === undefined
  const isPhone = ua.device.type === 'mobile'
  const isTablet = ua.device.type === 'tablet'

  return {
    isDesktop,
    isPhone,
    isTablet,
  }
}

app.get('/', (request, response) => {
  const data = {}

  response.render('pages/home', {
    ...dataDefault(request, response),
    ...data,
  })
})

app.listen(process.env.PORT || 3000)

module.exports = app
