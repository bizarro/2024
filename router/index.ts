import { Elysia } from 'elysia'

import page from '../controllers/page.ts'

const router = new Elysia({ name: 'bizarro.router' }).get('/', ({ request }) => page(request))

export { router }
