<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth.store'

const auth = useAuthStore()
const router = useRouter()

const signOut = async () => {
  await auth.logout()
  await router.push('/')
}
</script>

<template>
  <nav class="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
    <div class="container">
      <RouterLink class="navbar-brand" to="/">
        Delicity
      </RouterLink>
      <div class="d-flex align-items-center gap-3">
        <template v-if="auth.user">
          <RouterLink class="nav-link" to="/dashboard">
            Tableau de bord
          </RouterLink>
          <RouterLink class="nav-link" to="/notifications">
            Notifications
          </RouterLink>
          <RouterLink class="nav-link" to="/settings">
            Paramètres
          </RouterLink>
          <button class="btn btn-outline-light btn-sm" @click="signOut">
            Déconnexion
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
