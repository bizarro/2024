import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

import { router } from './router/index.ts'

const app = new Elysia({
  name: 'bizarro.cloudflare',
  adapter: CloudflareAdapter,
})
  .onRequest(({ request }) => {
    const url = new URL(request.url)

    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4)

      return Response.redirect(url.toString(), 301)
    }
  })
  .use(router)
  .compile()

export default app
