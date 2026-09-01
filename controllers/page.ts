import { createElement } from 'preact'
import { renderToString } from 'preact-render-to-string'
import { UAParser } from 'ua-parser-js'

import Home from '../templates/pages/Home.tsx'

export default function page(request: Request) {
  const ua = UAParser(request.headers.get('user-agent') ?? undefined)

  const isPhone = ua.device.type === 'mobile'
  const isTablet = ua.device.type === 'tablet'

  const html = renderToString(createElement(Home, { isPhone, isTablet }))

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}
