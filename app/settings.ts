import Settings from './Settings.svelte'
const app = new Settings({
  target: document.body,
  props: {
    name: 'Settings'
  }
})

export default app
