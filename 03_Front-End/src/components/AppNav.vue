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
  <nav class="navbar navbar-dark bg-dark" data-bs-theme="dark">
    <div class="container">
      <RouterLink class="navbar-brand text-white" to="/">
        Delicity
      </RouterLink>
      <div class="d-flex align-items-center gap-3">
        <template v-if="auth.user">
          <RouterLink class="nav-link text-white" to="/dashboard">
            Tableau de bord
          </RouterLink>
          <RouterLink class="nav-link text-white" to="/notifications">
            Notifications
          </RouterLink>
          <RouterLink class="nav-link text-white" to="/settings">
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

<style scoped>
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--bs-warning) !important;
}
</style>
