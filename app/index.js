import { App } from '@bizarro/slayt'

import { Home } from './pages/Home'

import { Home as HomeScene } from './scenes/Home'

import '../styles/index.scss'

const components = []
const datasets = []
const routes = [
  {
    component: Home,
    scene: HomeScene,
    template: 'home',
  },
]

document.fonts.ready.then(() => {
  App.createComponents(components)
  App.createDatasets(datasets)
  App.createRoutes(routes)

  App.initialize()
})
