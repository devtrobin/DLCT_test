<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  createUnavailability,
  deleteUnavailability,
  getUnavailabilities,
} from '../api/calendar.api'
import { ApiError } from '../api/http'

type Item = Awaited<ReturnType<typeof getUnavailabilities>>['items'][number]
const items = ref<Item[]>([])
const version = ref(0)
const startAt = ref('')
const endAt = ref('')
const reason = ref('')

const load = async () => {
  const result = await getUnavailabilities()
  items.value = result.items
  version.value = result.calendarVersion
}

const create = async () => {
  const body = {
    confirmCancellations: false,
    endAt: new Date(endAt.value).toISOString(),
    expectedCalendarVersion: version.value,
    reason: reason.value || undefined,
    startAt: new Date(startAt.value).toISOString(),
  }
  try {
    await createUnavailability(body)
  } catch (error) {
    if (!(error instanceof ApiError)
      || error.code !== 'CALENDAR_CHANGE_CONFIRMATION_REQUIRED') throw error
    const count = Array.isArray(error.details?.appointments)
      ? error.details.appointments.length : 0
    if (!confirm(`${count} rendez-vous seront annulés. Continuer ?`)) return
    if (!reason.value) {
      reason.value = prompt('Motif communiqué aux clients') ?? ''
    }
    if (!reason.value) return
    await createUnavailability({
      ...body,
      confirmCancellations: true,
      impactFingerprint: error.details?.impactFingerprint,
      reason: reason.value,
    })
  }
  startAt.value = ''
  endAt.value = ''
  reason.value = ''
  await load()
}

const remove = async (id: number) => {
  const result = await deleteUnavailability(id, version.value)
  version.value = result.calendarVersion
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <h1 class="h3">Indisponibilités exceptionnelles</h1>
    <form class="row g-2 mb-4" @submit.prevent="create">
      <div class="col-md"><input v-model="startAt" class="form-control"
           type="datetime-local" required></div>
      <div class="col-md"><input v-model="endAt" class="form-control"
           type="datetime-local" required></div>
      <div class="col-md"><input v-model="reason" class="form-control"
           placeholder="Motif"></div>
      <div class="col-auto">
        <button class="btn btn-primary">Ajouter</button>
      </div>
    </form>
    <div class="list-group">
      <div v-for="item in items" :key="item.id" class="list-group-item">
        {{ item.range.startAt }} — {{ item.range.endAt }}
        <span class="text-muted">{{ item.reason }}</span>
        <button class="btn btn-outline-danger btn-sm float-end"
                @click="remove(item.id)">Retirer</button>
      </div>
    </div>
  </section>
</template>
