<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppAlert from '../components/AppAlert.vue'
import { ApiError } from '../api/http'
import { useAuthStore } from '../stores/auth.store'
import type { UserRole } from '../types/api'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const role = ref<UserRole>('CLIENT')
const publicCode = ref('')
const error = ref('')

const submit = async () => {
  try {
    error.value = ''
    await auth.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
      role: role.value,
    })
    await router.push('/dashboard')
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.code : 'Erreur inattendue'
  }
}

const openPublic = () => {
  sessionStorage.setItem('publicCode', publicCode.value)
  router.push('/public-appointment')
}
</script>

<template>
  <div class="row g-4">
    <section class="col-lg-7">
      <div class="card shadow-sm"><div class="card-body p-4">
        <h1 class="h3">Connexion</h1>
        <AppAlert :message="error" />
        <form class="vstack gap-3" @submit.prevent="submit">
          <select v-model="role" class="form-select">
            <option value="CLIENT">Client</option>
            <option value="PROFESSIONAL">Restaurateur</option>
          </select>
          <input v-model="email" class="form-control" type="email"
                 placeholder="Adresse électronique" required>
          <input v-model="password" class="form-control" type="password"
                 placeholder="Mot de passe" required>
          <label class="form-check">
            <input v-model="rememberMe" class="form-check-input"
                   type="checkbox"> Rester connecté
          </label>
          <button class="btn btn-primary">Se connecter</button>
        </form>
        <div class="mt-3 d-flex gap-3">
          <RouterLink to="/register">Créer un compte</RouterLink>
          <RouterLink to="/forgot-password">Mot de passe oublié</RouterLink>
        </div>
      </div></div>
    </section>
    <section class="col-lg-5">
      <div class="card"><div class="card-body">
        <h2 class="h5">Retrouver une réservation</h2>
        <input v-model="publicCode" class="form-control mb-3"
               placeholder="Code public">
        <button class="btn btn-outline-primary" @click="openPublic">
          Consulter
        </button>
      </div></div>
    </section>
  </div>
</template>
