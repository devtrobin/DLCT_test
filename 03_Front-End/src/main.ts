import 'bootstrap/dist/css/bootstrap.min.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { useAuthStore } from './stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(router)

router.beforeEach(async (route) => {
  const auth = useAuthStore(pinia)
  if (!auth.loaded) await auth.load()
  if (route.meta.auth && !auth.user) return '/'
  if (route.meta.role && route.meta.role !== auth.user?.role) {
    return '/dashboard'
  }
})

app.mount('#app')
