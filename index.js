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

const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend')

const mailer = new MailerSend({
  apiKey: process.env.MAILER_API_KEY,
})

app.post('/contact', async (request, response) => {
  const from = new Sender(process.env.MAILER_FROM_EMAIL, process.env.MAILER_FROM_NAME)
  const to = [new Recipient(process.env.MAILER_RECIPIENT_EMAIL, process.env.MAILER_RECIPIENT_NAME)]

  const email = new EmailParams()
    .setFrom(from)
    .setTo(to)
    .setSubject('Bizarro Inquiry')
    .setHtml(
      `
      <strong>${request.body.subject} (${request.body.budget})</strong><br>
      ${request.body.message}
      <br>
      <br>
      <strong>${request.body.name}</strong><br>
      ${request.body.email}
    `,
    )
    .setReplyTo([new Sender(request.body.email, request.body.name)])

  await mailer.email
    .send(email)
    .then(async () => {
      return response.status(201).end()
    })
    .catch((error) => {
      console.log(error)

      return response.status(400).end()
    })
})

app.listen(process.env.PORT || 3000)

module.exports = app
