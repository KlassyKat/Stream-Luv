import AddWindow from './AddWindow.svelte'
const app = new AddWindow({
  target: document.body,
  props: {
    name: 'AddWindow'
  }
})

export default app
