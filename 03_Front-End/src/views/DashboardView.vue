<script setup lang="ts">
import { DateTime } from 'luxon'
import { onMounted, ref } from 'vue'

import { agenda, listClient } from '../api/appointment.api'
import AppointmentCard from '../components/AppointmentCard.vue'
import { useAuthStore } from '../stores/auth.store'
import type { Appointment } from '../types/api'

const auth = useAuthStore()
const appointments = ref<Appointment[]>([])

const load = async () => {
  if (auth.user?.role === 'CLIENT') {
    appointments.value = (await listClient()).items
    return
  }
  const monday = DateTime.now().startOf('week').toISODate()!
  const result = await agenda(monday)
  appointments.value = result.days.flatMap((day) => day.appointments)
}

onMounted(load)
</script>

<template>
  <header class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h1 class="h3 mb-1">Bonjour {{ auth.user?.firstName }}</h1>
      <p class="text-muted mb-0">
        {{ auth.user?.role === 'CLIENT'
          ? 'Vos prochains rendez-vous' : 'Votre agenda de la semaine' }}
      </p>
    </div>
    <div class="d-flex gap-2">
      <RouterLink v-if="auth.user?.role === 'CLIENT'"
                  class="btn btn-primary" to="/professionals">
        Réserver
      </RouterLink>
      <template v-else>
        <RouterLink class="btn btn-primary" to="/manual-booking">
          Nouveau rendez-vous
        </RouterLink>
        <RouterLink class="btn btn-outline-primary" to="/calendar">
          Gérer le calendrier
        </RouterLink>
      </template>
    </div>
  </header>
  <div v-if="appointments.length" class="row g-3">
    <div v-for="item in appointments" :key="item.id" class="col-md-6 col-xl-4">
      <AppointmentCard :appointment="item" />
    </div>
  </div>
  <div v-else class="alert alert-info">Aucun rendez-vous à afficher.</div>
</template>
