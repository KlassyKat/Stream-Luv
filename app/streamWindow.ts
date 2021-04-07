import StreamWindow from './StreamWindow.svelte'
const app = new StreamWindow({
  target: document.body,
  props: {
    name: 'StreamWindow'
  }
})

export default app
