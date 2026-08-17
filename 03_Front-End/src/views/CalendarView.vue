<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getWeekly, replaceWeekly } from '../api/calendar.api'
import { ApiError } from '../api/http'
import AppAlert from '../components/AppAlert.vue'

type Period = { weekday: number; startTime: string; endTime: string }
const periods = ref<Period[]>([])
const version = ref(0)
const message = ref('')
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi',
  'Samedi', 'Dimanche']

const load = async () => {
  const result = await getWeekly()
  version.value = result.calendarVersion
  periods.value = result.periods.map(({ weekday, startTime, endTime }) => ({
    endTime,
    startTime,
    weekday,
  }))
}

const add = () => periods.value.push({
  endTime: '18:00',
  startTime: '09:00',
  weekday: 1,
})

const save = async () => {
  try {
    const result = await replaceWeekly(version.value, periods.value) as {
      calendarVersion: number
    }
    version.value = result.calendarVersion
    message.value = 'Disponibilités enregistrées.'
  } catch (error) {
    if (error instanceof ApiError
      && error.code === 'CALENDAR_CHANGE_CONFIRMATION_REQUIRED') {
      const count = Array.isArray(error.details?.appointments)
        ? error.details.appointments.length : 0
      if (!confirm(`${count} rendez-vous seront annulés. Continuer ?`)) return
      const fingerprint = String(error.details?.impactFingerprint)
      await replaceWeekly(version.value, periods.value, true, fingerprint)
      await load()
      message.value = 'Calendrier modifié et rendez-vous annulés.'
      return
    }
    message.value = 'Vérifiez les plages ou rechargez le calendrier.'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="h3">Disponibilités hebdomadaires</h1>
    <AppAlert :message="message" type="warning" />
    <div v-for="(period, index) in periods" :key="index"
         class="row g-2 align-items-center mb-2">
      <div class="col-md-4">
        <select v-model="period.weekday" class="form-select">
          <option v-for="(day, dayIndex) in days" :key="day"
                  :value="dayIndex + 1">{{ day }}</option>
        </select>
      </div>
      <div class="col"><input v-model="period.startTime"
           class="form-control" type="time"></div>
      <div class="col"><input v-model="period.endTime"
           class="form-control" type="time"></div>
      <div class="col-auto">
        <button class="btn btn-outline-danger"
                @click="periods.splice(index, 1)">Retirer</button>
      </div>
    </div>
    <div class="d-flex gap-2 mt-3">
      <button class="btn btn-outline-primary" @click="add">Ajouter</button>
      <button class="btn btn-primary" @click="save">Enregistrer</button>
      <RouterLink class="btn btn-outline-secondary" to="/unavailabilities">
        Indisponibilités
      </RouterLink>
    </div>
  </section>
</template>
