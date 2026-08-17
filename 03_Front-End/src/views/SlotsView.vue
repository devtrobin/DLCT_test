<script setup lang="ts">
import { DateTime } from 'luxon'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { book } from '../api/appointment.api'
import { getSlots } from '../api/calendar.api'
import AppAlert from '../components/AppAlert.vue'
import { useAuthStore } from '../stores/auth.store'
import type { SlotDay } from '../types/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const professionalId = Number(route.params.id)
const from = ref(DateTime.now().toISODate()!)
const days = ref<SlotDay[]>([])
const error = ref('')

const load = async () => {
  const result = await getSlots(
    professionalId,
    from.value,
    auth.user?.timezone ?? 'Europe/Paris',
  )
  days.value = result.days
}

const move = async (daysToAdd: number) => {
  from.value = DateTime.fromISO(from.value)
    .plus({ days: daysToAdd }).toISODate()!
  await load()
}

const reserve = async (startAt: string) => {
  try {
    const appointment = await book(professionalId, startAt)
    await router.push(`/appointments/${appointment.id}`)
  } catch {
    error.value = 'Ce créneau vient de devenir indisponible.'
    await load()
  }
}

onMounted(load)
</script>

<template>
  <h1 class="h3">Créneaux disponibles</h1>
  <AppAlert :message="error" />
  <div class="btn-group mb-3">
    <button class="btn btn-outline-secondary" @click="move(-7)">
      Précédent
    </button>
    <button class="btn btn-outline-secondary" @click="move(7)">
      Suivant
    </button>
  </div>
  <div class="row g-3">
    <section v-for="day in days" :key="day.localDate" class="col-lg">
      <h2 class="h6">{{ day.localDate }}</h2>
      <button v-for="slot in day.slots" :key="slot.range.startAt"
              class="btn btn-outline-primary btn-sm d-block mb-2"
              @click="reserve(slot.range.startAt)">
        {{ DateTime.fromISO(slot.range.startAt).toFormat('HH:mm') }}
      </button>
      <small v-if="!day.slots.length" class="text-muted">Complet</small>
    </section>
  </div>
</template>
