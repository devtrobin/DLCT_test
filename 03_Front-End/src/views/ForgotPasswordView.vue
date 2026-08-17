<script setup lang="ts">
import { ref } from 'vue'

import { recoverPassword } from '../api/auth.api'
import AppAlert from '../components/AppAlert.vue'
import type { UserRole } from '../types/api'

const email = ref('')
const role = ref<UserRole>('CLIENT')
const message = ref('')
const error = ref('')

const submit = async () => {
  try {
    const result = await recoverPassword(email.value, role.value)
    message.value = 'Démo : le mot de passe enregistré est '
      + `« ${result.password} ».`
    error.value = ''
  } catch {
    error.value = 'Aucun compte trouvé.'
  }
}
</script>

<template>
  <section class="card mx-auto" style="max-width: 560px">
    <div class="card-body p-4">
      <h1 class="h3">Réinitialisation du mot de passe</h1>
      <p class="text-muted">
        Le parcours par courriel est simulé pour les besoins de la démo.
      </p>
      <AppAlert :message="error" />
      <AppAlert :message="message" type="warning" />
      <form class="vstack gap-3" @submit.prevent="submit">
        <select v-model="role" class="form-select">
          <option value="CLIENT">Client</option>
          <option value="PROFESSIONAL">Restaurateur</option>
        </select>
        <input v-model="email" class="form-control" type="email" required>
        <button class="btn btn-primary">Réinitialiser</button>
      </form>
    </div>
  </section>
</template>
