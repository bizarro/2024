import autoprefixer from 'autoprefixer'
import browsersync from 'rollup-plugin-browsersync'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import glslify from 'rollup-plugin-glslify'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import postcss from 'postcss'
import replace from '@rollup/plugin-replace'
import scss from 'rollup-plugin-scss'
import svg from 'rollup-plugin-svg-icons'
import terser from '@rollup/plugin-terser'

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'app/index.js',
  output: {
    file: 'public/assets/bundle.js',
    format: 'iife',
    sourcemap: !production,
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),

    copy({
      targets: [{ src: 'shared', dest: 'public' }],
    }),

    glslify({
      compress: production,
    }),

    nodeResolve(),

    commonjs(),

    scss({
      fileName: 'bundle.css',
      outputStyle: 'compressed',
      processor: () => postcss([autoprefixer()]),
      watch: 'styles',
    }),

    svg({
      inputFolder: 'sprites',
      output: 'public/assets/bundle.svg',
    }),

    !production &&
      browsersync({
        port: 3030,
        proxy: 'localhost:3000',
      }),

    production && terser(),
  ],
  preserveSymlinks: true,
}
