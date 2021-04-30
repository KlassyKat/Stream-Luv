const sveltePreConfig = require('./svelte.config')
import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import livereload from 'rollup-plugin-livereload'
import json from '@rollup/plugin-json'
import {
  terser
} from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'

const production = !process.env.ROLLUP_WATCH

export default [
  {
    // Main Window
    input: 'app/svelte.ts',

    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'public/build/bundle.js'
    },

    plugins: [
      svelte({
        ...sveltePreConfig,
        dev: !production,
        css: css => {
          css.write('public/build/bundle.css')
        }
      }),

      typescript(),

      alias({
        entries: [{
          find: /^@pkg\/(.*)/,
          replacement: 'packages/$1'
        }],
      }),

      resolve({
        browser: true,
        dedupe: ['svelte']
      }),

      commonjs(),

      postcss(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],

    watch: {
      clearScreen: false
    }
  },
  {
    //Add Window
    input: 'app/addWindow.ts',

    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'public/build/addWindow.js'
    },

    plugins: [
      svelte({
        ...sveltePreConfig,
        dev: !production,
        css: css => {
          css.write('public/build/addWindow.css')
        }
      }),

      typescript(),

      alias({
        entries: [{
          find: /^@pkg\/(.*)/,
          replacement: 'packages/$1'
        }],
      }),

      resolve({
        browser: true,
        dedupe: ['svelte']
      }),

      commonjs(),

      postcss(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],

    watch: {
      clearScreen: false
    }
  },
  {
    //Login Window
    input: 'app/login.ts',

    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'public/build/login.js'
    },

    plugins: [
      svelte({
        ...sveltePreConfig,
        dev: !production,
        css: css => {
          css.write('public/build/login.css')
        }
      }),

      typescript(),

      alias({
        entries: [{
          find: /^@pkg\/(.*)/,
          replacement: 'packages/$1'
        }],
      }),

      resolve({
        browser: true,
        dedupe: ['svelte']
      }),

      commonjs(),

      postcss(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],

    watch: {
      clearScreen: false
    }
  },
  {
    //Stream Window
    input: 'app/streamWindow.ts',

    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'public/build/streamWindow.js'
    },

    plugins: [
      svelte({
        ...sveltePreConfig,
        dev: !production,
        css: css => {
          css.write('public/build/streamWindow.css')
        }
      }),

      typescript(),

      alias({
        entries: [{
          find: /^@pkg\/(.*)/,
          replacement: 'packages/$1'
        }],
      }),

      resolve({
        browser: true,
        dedupe: ['svelte']
      }),

      commonjs(),

      postcss(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],

    watch: {
      clearScreen: false
    }
  },
  {
    //Settings Window
    input: 'app/settings.ts',

    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'public/build/settings.js'
    },

    plugins: [
      svelte({
        ...sveltePreConfig,
        dev: !production,
        css: css => {
          css.write('public/build/settings.css')
        }
      }),

      typescript(),

      alias({
        entries: [{
          find: /^@pkg\/(.*)/,
          replacement: 'packages/$1'
        }],
      }),

      resolve({
        browser: true,
        dedupe: ['svelte']
      }),

      commonjs(),

      postcss(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],

    watch: {
      clearScreen: false
    }
  },
  {
    //Stream Modal Window
    input: 'app/streamModal.ts',

    output: {
      sourcemap: !production,
      format: 'iife',
      name: 'app',
      file: 'public/build/streamModal.js'
    },

    plugins: [
      svelte({
        ...sveltePreConfig,
        dev: !production,
        css: css => {
          css.write('public/build/streamModal.css')
        }
      }),

      typescript(),

      alias({
        entries: [{
          find: /^@pkg\/(.*)/,
          replacement: 'packages/$1'
        }],
      }),

      resolve({
        browser: true,
        dedupe: ['svelte']
      }),

      commonjs(),

      postcss(),

      // In dev mode, call `npm run start` once
      // the bundle has been generated
      !production && serve(),

      // Watch the `public` directory and refresh the
      // browser on changes when not in production
      !production && livereload('public'),

      // If we're building for production (npm run build
      // instead of npm run dev), minify
      production && terser()
    ],

    watch: {
      clearScreen: false
    }
  },
  {
    input: 'app/main.ts',
    output: {
      sourcemap: true,
      format: 'cjs',
      name: 'app',
      file: 'app/bundle.js'
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript(),
      json()
    ]
  }
]

function serve() {
  let started = false

  return {
    writeBundle() {
      if (!started) {
        started = true

        require('child_process').spawn(
          'npm',
          ['run', 'svelte-start', '--', '--dev'], {
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
          }
        )
      }
    }
  }
}