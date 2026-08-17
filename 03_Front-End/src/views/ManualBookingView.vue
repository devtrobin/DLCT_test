<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { createManual } from '../api/appointment.api'
import AppAlert from '../components/AppAlert.vue'

const router = useRouter()
const error = ref('')
const form = ref({
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  startAt: '',
})

const submit = async () => {
  try {
    const result = await createManual({
      client: {
        email: form.value.email,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        phone: form.value.phone,
      },
      startAt: new Date(form.value.startAt).toISOString(),
    })
    await router.push(`/appointments/${result.appointment.id}`)
  } catch {
    error.value = 'Le créneau choisi n’est pas disponible.'
  }
}
</script>

<template>
  <section class="card"><div class="card-body">
    <h1 class="h3">Créer un rendez-vous manuellement</h1>
    <AppAlert :message="error" />
    <form class="row g-3" @submit.prevent="submit">
      <div class="col-md-6"><input v-model="form.firstName"
           class="form-control" placeholder="Prénom" required></div>
      <div class="col-md-6"><input v-model="form.lastName"
           class="form-control" placeholder="Nom" required></div>
      <div class="col-md-6"><input v-model="form.email"
           class="form-control" type="email" placeholder="Email" required></div>
      <div class="col-md-6"><input v-model="form.phone"
           class="form-control" placeholder="Téléphone" required></div>
      <div class="col-12"><input v-model="form.startAt"
           class="form-control" type="datetime-local" required></div>
      <div class="col-12"><button class="btn btn-primary">Créer</button></div>
    </form>
  </div></section>
</template>
