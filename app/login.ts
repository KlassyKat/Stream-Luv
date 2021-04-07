import Login from './Login.svelte'
const app = new Login({
  target: document.body,
  props: {
    name: 'login'
  }
})

export default app
