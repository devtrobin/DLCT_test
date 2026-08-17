<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppAlert from '../components/AppAlert.vue'
import TimezoneSelect from '../components/TimezoneSelect.vue'
import { ApiError } from '../api/http'
import { useAuthStore } from '../stores/auth.store'
import type { UserRole } from '../types/api'

const auth = useAuthStore()
const router = useRouter()
const error = ref('')
const form = ref({
  businessName: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  phone: '',
  role: 'CLIENT' as UserRole,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

const submit = async () => {
  try {
    error.value = ''
    await auth.register({
      ...form.value,
      businessName: form.value.role === 'PROFESSIONAL'
        ? form.value.businessName : undefined,
    })
    await router.push('/dashboard')
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.code : 'Erreur inattendue'
  }
}
</script>

<template>
  <section class="card shadow-sm mx-auto" style="max-width: 700px">
    <div class="card-body p-4">
      <h1 class="h3">Créer un compte</h1>
      <AppAlert :message="error" />
      <form class="row g-3" @submit.prevent="submit">
        <div class="col-12">
          <select v-model="form.role" class="form-select">
            <option value="CLIENT">Client</option>
            <option value="PROFESSIONAL">Restaurateur</option>
          </select>
        </div>
        <div v-if="form.role === 'PROFESSIONAL'" class="col-12">
          <input v-model="form.businessName" class="form-control"
                 placeholder="Nom commercial" required>
        </div>
        <div class="col-md-6">
          <input v-model="form.firstName" class="form-control"
                 placeholder="Prénom" required>
        </div>
        <div class="col-md-6">
          <input v-model="form.lastName" class="form-control"
                 placeholder="Nom" required>
        </div>
        <div class="col-md-6">
          <input v-model="form.email" class="form-control" type="email"
                 placeholder="Adresse électronique" required>
        </div>
        <div class="col-md-6">
          <input v-model="form.phone" class="form-control"
                 placeholder="Téléphone" required>
        </div>
        <div class="col-md-6">
          <input v-model="form.password" class="form-control" type="password"
                 minlength="8" placeholder="Mot de passe" required>
        </div>
        <div class="col-md-6">
          <TimezoneSelect v-model="form.timezone" />
        </div>
        <div class="col-12 d-flex gap-2">
          <button class="btn btn-primary">S'inscrire</button>
          <RouterLink class="btn btn-outline-secondary" to="/">
            Annuler
          </RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>
